import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import axios from "axios";
import axiosRetry from "axios-retry";
import { trackCoinSearch } from "@/lib/coins";
import { z } from "zod";

// --- Constants ---
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const DEXSCREENER_API_BASE = "https://api.dexscreener.com/latest/dex";
const GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1";
const COINGECKO_REGEX = /coingecko\.com\/en\/coins\/([a-zA-Z0-9-]+)/;
const DEXSCREENER_URL_REGEX = /dexscreener\.com\/([^\/]+)\/([a-zA-Z0-9-_]{32,44})(\/|$)/;
const PAIR_REGEX = /\$([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/;
const URL_REGEX = /(https?:\/\/[^\s]+)/;
const CONTRACT_ADDRESS_REGEX = /^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/;
const CHAIN_EXPLORERS = {
  ethereum: "https://api.etherscan.io/api",
  bsc: "https://api.bscscan.com/api",
  polygon: "https://api.polygonscan.com/api",
  arbitrum: "https://api.arbiscan.io/api",
  optimism: "https://api.optimistic.etherscan.io/api",
  solana: "https://api.solscan.io/account",
};

// --- Type Definitions ---
interface CoinData {
  name: string;
  symbol: string;
  price: number;
  change24h: number | null;
  baseSymbol?: string;
  pairAddress?: string;
  contractAddress?: string;
  chain?: string;
}

// Add new interface for analysis data
interface AnalysisData {
  price: string;
  entryStrategy: string;
  leverage: string;
  stopLoss: string;
  takeProfit: string;
  duration: string;
  riskLevel: string;
  summary: string;
  tradeType?: string;
}

// --- Prompts ---
const SAMARITAN_PROMPT = `You are Investinex, a specialized cryptocurrency investment advisor. Generate analysis in this exact JSON format:
{{
  "price": "$0.000025 (format: $X.XXXXX, include 24h change if available)",
  "entryStrategy": "Long/Short at $X.XXXXX (specific price/condition)",
  "leverage": "xX (number between 3-20)",
  "stopLoss": "$X.XXXXX ➘ (with arrow)",
  "takeProfit": "$X.XXXXX ➚ (with arrow)",
  "duration": "X-Xh (time in hours)",
  "riskLevel": "🔴 High/🟠 Medium/🟢 Low",
  "summary": "One paragraph summarizing key analysis points"
}}

Analysis Requirements:
1. Base recommendations on technical analysis and market sentiment
2. Include precise numerical values for all metrics
3. Risk assessment must match volatility and leverage
4. Summary should be concise (3-5 sentences) and actionable`;

// Add new SUMMARY_PROMPT
const SUMMARY_PROMPT = `Condense this trading analysis into a single paragraph (5-7 sentences) highlighting:
- Key price levels and targets
- Risk-reward ratio
- Market conditions
- Recommended strategy
- Timeframe

Write in clear, professional language without markdown.`;

// Extraction prompt for queries without links – looks for tokens with a '$'
const EXTRACT_PROMPT = `You are an assistant that extracts cryptocurrency symbols or names mentioned in a sentence.
If a word is prefixed with a '$' sign (e.g., $chillguy), extract it as a cryptocurrency name.
If multiple coins are mentioned, list them separated by commas.
If no cryptocurrency is mentioned, respond with "none".

Extract from the following input:
"{input}"`;

// This prompt is used when a link is provided. It extracts the coin name and current price from the text.
const LINK_EXTRACTION_PROMPT = `You are an assistant that extracts cryptocurrency information from a block of text.
Look for the cryptocurrency name and its current price.
If found, output in the format: "Coin: <coin_name>, Price: <current_price>".
If no cryptocurrency information is detected, output "none".

Text: "{input}"`;

// Update FORMATTING_PROMPT with static class names
const FORMATTING_PROMPT = `
<h1 class="text-2xl font-bold text-white-300 tracking-wide mb-4 {{fontClass}}">Investinex Analysis</h1>
<table class="w-full border-collapse bg-indigo-500/5 backdrop-blur-sm rounded-lg overflow-hidden">
  <thead class="bg-indigo-500/10">
    <tr>
      <th class="p-3 text-left text-indigo-300 font-semibold">Metric</th>
      <th class="p-3 text-left text-indigo-300 font-semibold">Value</th>
    </tr>
  </thead>
  <tbody>
    <!-- Price Section -->
    <tr class="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">💰 Current Price</td>
      <td class="p-3 font-semibold">
        <span class="text-violet-300">{{basePrice}}</span>
        <span class="{{priceChangeColor}}">{{priceChange}}</span>
      </td>
    </tr>
    
    <!-- Trade Type -->
    <tr class="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">🔀 Type of Trade</td>
      <td class="p-3 {{tradeColor}} font-semibold">{{tradeType}}</td>
    </tr>
    
    <!-- Spacer -->
    <tr><td colspan="2" class="h-4"></td></tr>
    
    <!-- Entry Levels -->
    <tr class="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">📈 Entry</td>
      <td class="p-3 text-gray-300 font-semibold">{{entryText}} <span class="{{entryColor}}">{{entryPrice}}</span>{{entryReason}}</td>
    </tr>
    <tr class="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">🎯 Take Profit</td>
      <td class="p-3 text-emerald-400 font-semibold">{{takeProfit}}</td>
    </tr>
    <tr class="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">🛑 Stop Loss</td>
      <td class="p-3 text-rose-400 font-semibold">{{stopLoss}}</td>
    </tr>
    <tr class="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">⚖️ Leverage</td>
      <td class="p-3 text-amber-400 font-semibold">{{leverage}}</td>
    </tr>
    
    <!-- Spacer -->
    <tr><td colspan="2" class="h-4"></td></tr>
    
    <!-- Risk Management -->
    <tr class="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">⏳ Duration</td>
      <td class="p-3 text-violet-300 font-semibold">{{duration}}</td>
    </tr>
    <tr class="hover:bg-indigo-500/5 transition-colors">
      <td class="p-3 text-gray-200 font-medium">🔒 Risk</td>
      <td class="p-3 text-rose-400 font-semibold">{{riskLevel}}</td>
    </tr>
  </tbody>
</table>`;

// --- Helper Functions ---
async function fetchSearchResults(query: string) {
  axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  const url = GOOGLE_SEARCH_URL;

  const params = {
    q: query,
    key: apiKey,
    cx: cx,
  };

  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("[SEARCH_ERROR]", error);
    throw new Error("Failed to fetch search results");
  }
}

async function fetchCoinGeckoPrice(coinId: string): Promise<CoinData | null> {
  try {
    axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
    const searchResponse = await axios.get(
      `${COINGECKO_API_BASE}/search?query=${coinId}`
    );

    const coinMatch = searchResponse.data.coins?.[0];
    if (!coinMatch) {
      return null;
    }

    const priceResponse = await axios.get(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinMatch.id}&vs_currencies=usd&include_24hr_change=true`
    );

    if (priceResponse.data[coinMatch.id]) {
      const data = priceResponse.data[coinMatch.id];

      try {
        await trackCoinSearch(coinMatch.name, coinMatch.symbol);
      } catch (error) {
        console.error("[SEARCH_TRACKING_ERROR]:", error);
      }

      return {
        name: coinMatch.name,
        symbol: coinMatch.symbol.toUpperCase(),
        price: data.usd,
        change24h: data.usd_24h_change ?? null,
      };
    }
    return null;
  } catch (error) {
    console.error("[COINGECKO_ERROR]", error);
    return null;
  }
}

async function fetchDexscreenerPrice(
  tokenSymbol: string,
  baseSymbol: string
): Promise<CoinData | null> {
  try {
    axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
    const pairResponse = await axios.get(
      `${DEXSCREENER_API_BASE}/search?q=${tokenSymbol}/${baseSymbol}`
    );
    const pairs = pairResponse.data.pairs;

    if (!pairs || pairs.length === 0) {
      return null;
    }

    let bestPair = null;
    for (const pair of pairs) {
      if (
        pair.baseToken.symbol.toUpperCase() === tokenSymbol.toUpperCase() &&
        pair.quoteToken.symbol.toUpperCase() === baseSymbol.toUpperCase()
      ) {
        if (!bestPair || pair.liquidity.usd > bestPair.liquidity.usd) {
          bestPair = pair;
        }
      }
    }
    if (!bestPair) {
      return null;
    }

    let priceUsd = parseFloat(bestPair.priceNative);
    if (bestPair.quoteToken.symbol.toUpperCase() !== "USDC") {
      const quoteTokenPriceResponse = await axios.get(
        `${DEXSCREENER_API_BASE}/tokens/${bestPair.quoteToken.address}`
      );

      const quoteTokenPairs = quoteTokenPriceResponse.data.pairs;

      if (!quoteTokenPairs || quoteTokenPairs.length === 0) {
        return null;
      }

      let usdQuotePair = null;
      for (const pair of quoteTokenPairs) {
        if (pair.quoteToken.symbol.toUpperCase() === "USDC") {
          if (
            !usdQuotePair ||
            (pair.liquidity?.usd ?? 0) > (usdQuotePair.liquidity?.usd ?? 0)
          ) {
            usdQuotePair = pair;
          }
        }
      }

      if (!usdQuotePair) {
        return null;
      }

      const quoteTokenPriceUsd = parseFloat(usdQuotePair.priceNative);
      priceUsd *= quoteTokenPriceUsd;
    }

    return {
      name: bestPair.baseToken.name,
      symbol: bestPair.baseToken.symbol.toUpperCase(),
      price: priceUsd,
      change24h: bestPair.priceChange.h24,
      baseSymbol: bestPair.quoteToken.symbol.toUpperCase(),
      pairAddress: bestPair.pairAddress,
    };
  } catch (error) {
    console.error("[DEXSCREENER_ERROR]", error);
    return null;
  }
}

function extractURL(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function extractCoinGeckoId(url: string): string | null {
  try {
    const match = url.match(COINGECKO_REGEX);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

function extractDexscreenerPair(
  text: string
): { token: string; base: string } | null {
  const urlMatch = text.match(DEXSCREENER_URL_REGEX);

  if (urlMatch) {
    return { token: urlMatch[1], base: "DIRECT" };
  }

  const match = text.match(PAIR_REGEX);
  if (match) {
    return { token: match[1], base: match[2] };
  }
  return null;
}

async function fetchTokenFromContract(address: string): Promise<CoinData | null> {
  try {
    // Handle Solana addresses differently
    if (address.length >= 32 && address.length <= 44) {
      const solanaResponse = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${address}`
      );

      if (solanaResponse.data.pairs?.length > 0) {
        const bestPair = solanaResponse.data.pairs.reduce((prev, current) => 
          (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current
        );

        return {
          name: bestPair.baseToken?.name || "Unknown Token",
          symbol: bestPair.baseToken?.symbol || "UNKNOWN",
          price: parseFloat(bestPair.priceUsd || "0"),
          change24h: parseFloat(bestPair.priceChange?.h24 || "0"),
          contractAddress: address,
          chain: "solana",
          baseSymbol: bestPair.quoteToken?.symbol,
          pairAddress: bestPair.pairAddress,
        };
      }
    }

    // First try DexScreener as it supports multiple chains
    const dexResponse = await axios.get(
      `${DEXSCREENER_API_BASE}/tokens/${address}`
    );

    if (dexResponse.data.pairs && dexResponse.data.pairs.length > 0) {
      const bestPair = dexResponse.data.pairs.reduce((prev, current) => {
        return (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0)
          ? prev
          : current;
      });

      return {
        name: bestPair.baseToken.name || "Unknown Token",
        symbol: bestPair.baseToken.symbol.toUpperCase(),
        price: parseFloat(bestPair.priceUsd || "0"),
        change24h: parseFloat(bestPair.priceChange?.h24 || "0"),
        contractAddress: address,
        chain: bestPair.chainId,
        baseSymbol: bestPair.quoteToken.symbol,
        pairAddress: bestPair.pairAddress,
      };
    }

    // If DexScreener fails, try each chain explorer
    for (const [chain, apiUrl] of Object.entries(CHAIN_EXPLORERS)) {
      const response = await axios.get(apiUrl, {
        params: {
          module: "token",
          action: "tokeninfo",
          contractaddress: address,
          apikey: process.env[`${chain.toUpperCase()}_SCAN_API_KEY`],
        },
      });

      if (response.data.status === "1" && response.data.result) {
        const tokenInfo = response.data.result[0];
        
        // Try to get price from CoinGecko using symbol
        const cgData = await fetchCoinGeckoPrice(tokenInfo.symbol);
        
        return {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          price: cgData?.price || 0,
          change24h: cgData?.change24h || null,
          contractAddress: address,
          chain: chain,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[CONTRACT_FETCH_ERROR]", error);
    return null;
  }
}

async function fetchDexscreenerPairInfo(pairAddress: string): Promise<CoinData | null> {
  try {
    axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
    
    // For Solana addresses, we need to use the tokens endpoint
    if (pairAddress.length >= 32 && pairAddress.length <= 44) {
      const response = await axios.get(
        `${DEXSCREENER_API_BASE}/tokens/${pairAddress}`
      );

      if (!response.data.pairs || response.data.pairs.length === 0) {
        return null;
      }

      // Get the pair with highest liquidity
      const bestPair = response.data.pairs.reduce((prev: any, current: any) => 
        (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current
      );

      return {
        name: bestPair.baseToken.name,
        symbol: bestPair.baseToken.symbol.toUpperCase(),
        price: parseFloat(bestPair.priceUsd || bestPair.priceNative),
        change24h: bestPair.priceChange?.h24 || null,
        baseSymbol: bestPair.quoteToken.symbol.toUpperCase(),
        pairAddress: bestPair.pairAddress,
        contractAddress: bestPair.baseToken.address,
        chain: bestPair.chainId
      };
    }

    // For other chains, use the pairs endpoint
    const response = await axios.get(
      `${DEXSCREENER_API_BASE}/pairs/${pairAddress}`
    );

    if (!response.data.pair) {
      return null;
    }

    const pair = response.data.pair;
    return {
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol.toUpperCase(),
      price: parseFloat(pair.priceUsd || pair.priceNative),
      change24h: pair.priceChange?.h24 || null,
      baseSymbol: pair.quoteToken.symbol.toUpperCase(),
      pairAddress: pair.pairAddress,
      contractAddress: pair.baseToken.address,
      chain: pair.chainId
    };
  } catch (error) {
    console.error("[DEXSCREENER_ERROR]", error);
    return null;
  }
}

async function getCoinData(userInput: string): Promise<CoinData | null> {
  const dexscreenerMatch = userInput.match(DEXSCREENER_URL_REGEX);
  if (dexscreenerMatch) {
    const [_, chain, pairAddress] = dexscreenerMatch;
    if (!pairAddress) return null;

    // Handle Solana pairs differently
    if (chain.toLowerCase() === 'solana') {
      try {
        const pairResponse = await axios.get(
          `${DEXSCREENER_API_BASE}/pairs/solana/${pairAddress}`
        );

        if (!pairResponse.data.pairs || pairResponse.data.pairs.length === 0) {
          return null;
        }

        const pair = pairResponse.data.pairs[0];
        return {
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol.toUpperCase(),
          price: parseFloat(pair.priceUsd || pair.priceNative),
          change24h: pair.priceChange?.h24 || null,
          baseSymbol: pair.quoteToken.symbol.toUpperCase(),
          pairAddress: pair.pairAddress,
          contractAddress: pair.baseToken.address,
          chain: 'solana'
        };
      } catch (error) {
        console.error("[SOLANA_PAIR_ERROR]", error);
        return null;
      }
    }
    
    return await fetchDexscreenerPairInfo(pairAddress);
  }
  
  // First check if input is a contract address
  if (CONTRACT_ADDRESS_REGEX.test(userInput.trim())) {
    return await fetchTokenFromContract(userInput.trim());
  }

  const dexscreenerPair = extractDexscreenerPair(userInput);

  if (dexscreenerPair) {
    const { token, base } = dexscreenerPair;
    let coinData = null;
    if (base === "DIRECT") {
      const urlMatch = userInput.match(DEXSCREENER_URL_REGEX);
      if (urlMatch) {
        const chain = urlMatch[1];
        const pairAddress = urlMatch[2];

        const pairResponse = await axios.get(
          `${DEXSCREENER_API_BASE}/pairs/${chain}/${pairAddress}`
        );
        const pair = pairResponse.data.pair;

        if (pair) {
          let priceUsd = parseFloat(pair.priceNative);
          if (pair.quoteToken.symbol.toUpperCase() !== "USDC") {
            const quoteTokenPriceResponse = await axios.get(
              `${DEXSCREENER_API_BASE}/tokens/${pair.quoteToken.address}`
            );

            const quoteTokenPairs = quoteTokenPriceResponse.data.pairs;

            if (!quoteTokenPairs || quoteTokenPairs.length === 0) {
              return null;
            }

            let usdQuotePair = null;
            for (const quotePair of quoteTokenPairs) {
              if (quotePair.quoteToken.symbol.toUpperCase() === "USDC") {
                if (
                  !usdQuotePair ||
                  (quotePair.liquidity?.usd ?? 0) >
                    (usdQuotePair.liquidity?.usd ?? 0)
                ) {
                  usdQuotePair = quotePair;
                }
              }
            }

            if (!usdQuotePair) {
              return null;
            }

            const quoteTokenPriceUsd = parseFloat(usdQuotePair.priceNative);
            priceUsd *= quoteTokenPriceUsd;
          }

          coinData = {
            name: pair.baseToken.name,
            symbol: pair.baseToken.symbol.toUpperCase(),
            price: priceUsd,
            change24h: pair.priceChange.h24,
            baseSymbol: pair.quoteToken.symbol.toUpperCase(),
            pairAddress: pair.pairAddress,
          };
        }
      }
    } else {
      coinData = await fetchDexscreenerPrice(token, base);
    }

    return coinData;
  } else {
    const link = extractURL(userInput);
    if (link) {
      const coinGeckoId = extractCoinGeckoId(link);

      if (coinGeckoId) {
        const coinData = await fetchCoinGeckoPrice(coinGeckoId);
        return coinData;
      } else {
        try {
          const linkResponse = await axios.get(link);
          let pageText = linkResponse.data;
          pageText = pageText.replace(/<[^>]*>/g, " ");

          const linkExtractPrompt = ChatPromptTemplate.fromMessages([
            ["system", LINK_EXTRACTION_PROMPT],
            ["human", "{input}"],
          ]);
          const linkExtractChain = linkExtractPrompt.pipe(
            new ChatGoogleGenerativeAI({
              modelName: "gemini-2.0-flash-exp",
              maxRetries: 2,
              temperature: 0.8,
              apiKey: process.env.GOOGLE_API_KEY,
            })
          );
          const extractionFromLink = await linkExtractChain.invoke({
            input: pageText,
          });
          const extractedInfo = extractionFromLink.content.trim();

          const coinMatch = extractedInfo.match(/Coin:\s*([^,]+)/i);
          const priceMatch = extractedInfo.match(/Price:\s*(.+)/i);
          const coin = coinMatch ? coinMatch[1].trim() : "";
          const priceInfo = priceMatch ? priceMatch[1].trim() : "";

          if (!coin) {
            return null;
          }

          return {
            name: coin,
            symbol: coin,
            price: parseFloat(priceInfo.replace(/[^0-9.-]+/g, "")),
            change24h: null,
          };
        } catch (error) {
          console.error("[LINK_FETCH_ERROR]", error);
          return null;
        }
      }
    } else {
      const extractChain = ChatPromptTemplate.fromMessages([
        ["system", EXTRACT_PROMPT],
        ["human", "{input}"],
      ]).pipe(
        new ChatGoogleGenerativeAI({
          modelName: "gemini-2.0-flash-exp",
          maxRetries: 2,
          temperature: 0.8,
          apiKey: process.env.GOOGLE_API_KEY,
        })
      );
      const extractionResponse = await extractChain.invoke({
        input: userInput,
      });
      let cryptoSymbols = extractionResponse.content.trim();

      if (cryptoSymbols.toLowerCase() !== "none" && cryptoSymbols !== "") {
        const symbolsArray = cryptoSymbols.split(/[\s,]+/);
        let coin = symbolsArray[0];
        if (coin.startsWith("$")) {
          coin = coin.substring(1);
        }

        let coinData = await fetchCoinGeckoPrice(coin);

        if (!coinData) {
          coinData = await fetchDexscreenerPrice(coin, "USDC");
        }

        if (coinData) {
          return coinData;
        } else {
          const cryptoQuery = `${coin} price cryptocurrency`;
          const searchResults = await fetchSearchResults(cryptoQuery);
          const relevantInfo = searchResults.items
            ? searchResults.items.map((item) => item.snippet).join(" ")
            : "No price information found.";

          return {
            name: coin,
            symbol: coin,
            price: parseFloat(relevantInfo.replace(/[^0-9.-]+/g, "")),
            change24h: null,
          };
        }
      } else {
        return null;
      }
    }
  }
}

async function formatTradingRecommendation(
  analysisData: AnalysisData,
  model: ChatGoogleGenerativeAI
): Promise<string> {
  // Import the font
  const { coolvetica } = await import('@/app/fonts');
  
  // Generate summary
  const summaryPrompt = ChatPromptTemplate.fromMessages([
    ["system", SUMMARY_PROMPT],
    ["human", "{input}"],
  ]);
  
  const summaryChain = summaryPrompt.pipe(model);
  const summaryResponse = await summaryChain.invoke({
    input: analysisData.summary,
  });

  // Extract and format price components
  const [basePrice, priceChange] = analysisData.price.split(' ');
  const changeValue = priceChange ? parseFloat(priceChange.replace(/[()%]/g, '')) : 0;
  const formattedChange = changeValue >= 0 ? `(+${changeValue}%)` : `(${changeValue}%)`;
  const priceChangeColor = changeValue >= 0 ? 'text-emerald-400' : 'text-rose-400';

  // Extract trade type and colors
  const tradeType = analysisData.entryStrategy.toLowerCase().includes('short') ? 'Short' : 'Long';
  const tradeColor = tradeType === 'Short' ? 'text-rose-400' : 'text-emerald-400';

  // Format entry strategy components
  const entryMatch = analysisData.entryStrategy.match(/(Short|Long) at (\$[\d.]+)(.*)/);
  const [_, entryType, entryPrice, entryReason] = entryMatch || ['', '', '', ''];
  const entryText = `${entryType} at `;
  const entryColor = entryType.toLowerCase() === 'short' ? 'text-white-400' : 'text-white-400';

  const tableHTML = FORMATTING_PROMPT
    .replace("{{fontClass}}", coolvetica.className)
    .replace("{{basePrice}}", basePrice)
    .replace("{{priceChange}}", formattedChange)
    .replace("{{priceChangeColor}}", priceChangeColor)
    .replace("{{tradeType}}", tradeType)
    .replace("{{tradeColor}}", tradeColor)
    .replace("{{entryText}}", entryText)
    .replace("{{entryPrice}}", entryPrice)
    .replace("{{entryColor}}", entryColor)
    .replace("{{entryReason}}", entryReason || '')
    .replace("{{leverage}}", analysisData.leverage)
    .replace("{{stopLoss}}", analysisData.stopLoss)
    .replace("{{takeProfit}}", analysisData.takeProfit)
    .replace("{{duration}}", analysisData.duration)
    .replace("{{riskLevel}}", analysisData.riskLevel);

  return `${tableHTML}\n\n<div class="mt-6 p-4 bg-indigo-500/5 rounded-lg backdrop-blur-sm border border-indigo-500/10">\n  <h3 class="text-lg font-semibold text-indigo-300 mb-2">Summary</h3>\n  <p class="text-gray-300 leading-relaxed">${summaryResponse.content}</p>\n</div>`;
}

async function generateTradingRecommendation(
  coinData: CoinData,
  chatHistory: { role: string; content: string }[],
  model: ChatGoogleGenerativeAI,
  lastMessage: string
): Promise<AnalysisData> {
  const marketData = `Current market data for ${coinData.name} (${coinData.symbol}${coinData.baseSymbol ? "/" + coinData.baseSymbol : ""}):
- Price: $${coinData.price.toFixed(8)}
- 24h Change: ${coinData.change24h ? coinData.change24h.toFixed(2) + "%" : "N/A"}
- Market Cap: ${coinData.price * 1_000_000 /* Replace with actual market cap data */}
- Trading Volume: ${coinData.price * 100_000 /* Replace with actual volume data */}`;

  const analysisChain = ChatPromptTemplate.fromMessages([
    ["system", SAMARITAN_PROMPT],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]).pipe(model);

  try {
    const response = await analysisChain.invoke({
      chat_history: chatHistory,
      input: `${lastMessage}\n\n${marketData}`,
    });

    // Add enhanced JSON validation
    const parsed = JSON.parse(response.content.replace(/```json/g, '').replace(/```/g, '').trim());
    
    const requiredFields = ['price', 'entryStrategy', 'leverage', 'stopLoss', 'takeProfit', 'duration', 'riskLevel', 'summary'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }

    // Validate number formats
    const priceRegex = /^\$?\d+(?:\.\d+)?/;
    if (!priceRegex.test(parsed.price)) {
      throw new Error(`Invalid price format: ${parsed.price}`);
    }

    return {
      price: parsed.price,
      entryStrategy: parsed.entryStrategy,
      leverage: parsed.leverage,
      stopLoss: parsed.stopLoss,
      takeProfit: parsed.takeProfit,
      duration: parsed.duration,
      riskLevel: parsed.riskLevel,
      summary: parsed.summary,
      tradeType: parsed.entryStrategy.toLowerCase().includes('short') ? 'Short' : 'Long',
    };
  } catch (error) {
    console.error("Analysis generation error:", error);
    // Generate fallback analysis using basic calculations
    const fallbackPrice = `$${coinData.price.toFixed(2)}`;
    const fallbackChange = coinData.change24h ? Math.abs(coinData.change24h).toFixed(2) + '%' : 'N/A';
    
    return {
      price: fallbackPrice,
      entryStrategy: `Long at $${(coinData.price * 1.02).toFixed(2)}`,
      leverage: 'x5',
      stopLoss: `$${(coinData.price * 0.97).toFixed(2)} ➘`,
      takeProfit: `$${(coinData.price * 1.05).toFixed(2)} ➚`,
      duration: '4-6h',
      riskLevel: coinData.change24h && Math.abs(coinData.change24h) > 10 ? '🔴 High' : '🟠 Medium',
      summary: `Based on current price of ${fallbackPrice} and 24h change of ${fallbackChange}, ` +
        'a moderate long position is recommended with tight stop loss. ' +
        'Monitor volume changes closely in the suggested timeframe.'
    };
  }
}

const requestSchema = z.object({
  messages: z.array(z.array(z.string())),
});

export async function POST(req: Request) {
  try {
    const validatedReq = requestSchema.safeParse(await req.json());
    if (!validatedReq.success) {
      return NextResponse.json(
        { error: "Invalid input format." },
        { status: 400 }
      );
    }

    const { messages } = validatedReq.data;

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      maxRetries: 2,
      temperature: 0.8,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const chatHistory = messages
      .slice(0, -1)
      .filter((msg) => msg[0] !== "system")
      .map((msg) => ({ role: msg[0], content: msg[1] }));

    const lastMessage = messages[messages.length - 1][1];
    const coinData = await getCoinData(lastMessage);

    if (!coinData) {
      return NextResponse.json({
        content:
          "I couldn't detect a valid cryptocurrency in your query. Please prefix the cryptocurrency name with a '$' sign (e.g., '$bitcoin') or enter a coingecko link and try again.",
      });
    }

    const analysisData = await generateTradingRecommendation(
      coinData,
      chatHistory,
      model,
      lastMessage
    );
    const formattedRecommendation = await formatTradingRecommendation(
      analysisData,
      model
    );

    return NextResponse.json({
      content: formattedRecommendation,
      rawContent: JSON.stringify(analysisData),
    });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
