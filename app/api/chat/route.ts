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
const DEXSCREENER_URL_REGEX = /dexscreener\.com\/[a-zA-Z0-9]+\/([a-zA-Z0-9]+)/;
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

// --- Prompts ---
const SAMARITAN_PROMPT = `You are Investinex, a specialized cryptocurrency investment advisor. You already have all the necessary market data, so provide immediate analysis without any waiting messages. Here's your operational framework:

1. **Analysis Protocol** 📊:
   - Analyze the provided market data and current conditions
   - For contract addresses, include chain information and contract verification status
   - Focus on short-term trading opportunities (20 minutes to 8 hours)
   - Consider market volatility and risk management
   - Base recommendations on technical analysis and market sentiment

2. **Trade Specification Requirements** 📝:
   - **Entry Strategy**: Specify exact entry points and conditions 📍
   - **Leverage Recommendation** (range: x3 to x20) 🔍
   - **Precise Stop Loss Levels** ⚠️
   - **Clear Take Profit Targets** 🎯
   - **Estimated Trade Duration** ⏳
   - **Risk Assessment** 🔒

Important: Never say you are waiting or gathering information. You already have all required data in the input. Provide immediate, actionable trading analysis.

Format your response in a clear, structured manner with appropriate spacing and emojis for better readability.

Example Input:
User: $SHIB
Market Data: SHIB (SHIB/USDC): Price: $0.000025, 24h Change: -2.5%

Example Output:
(Formatted HTML with Tailwind as described in FORMATTING_PROMPT)
`;

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

// Add this new formatting prompt at the top with other prompts
const FORMATTING_PROMPT = `You are a UI formatting expert. Format the given trading analysis text to be more visually appealing using HTML and Tailwind CSS classes.

Guidelines:
1. Generate ONLY HTML with Tailwind classes. Do not include any markdown.
2. Use semantic HTML elements (div, h1, h2, p, ul, li, table, tr, td, th) with appropriate Tailwind classes

3. Follow this structure for the main container:
   <div class="space-y-4 text-white">
     <h1>Title</h1>
     <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
       <h2>Section</h2>
       <p>Content</p>
     </div>
   </div>

4. For tables, use this structure:
   <table class="w-full border-collapse">
     <thead class="bg-indigo-500/10">
       <tr>
         <th class="p-2 text-left border border-indigo-500/20 text-indigo-300">Header</th>
       </tr>
     </thead>
     <tbody>
       <tr class="border-b border-indigo-500/10">
         <td class="p-2 text-gray-200">Content</td>
       </tr>
     </tbody>
   </table>

5. Use these predefined color schemes:
   TITLES & HEADERS:
   - Main title: class="text-xl font-bold text-indigo-300"
   - Section headers: class="text-lg font-semibold text-indigo-200"
   
   METRICS & VALUES:
   - Profit/Positive: class="text-emerald-400 font-semibold"
   - Loss/Negative: class="text-rose-400 font-semibold"
   - Warning/Risk: class="text-amber-400 font-semibold"
   - Neutral/Current: class="text-violet-300 font-semibold"
   
   CONTAINERS:
   - Section backgrounds: class="bg-indigo-500/10"
   - Borders: class="border-indigo-500/20"
   - Regular text: class="text-base text-gray-200"

6. Use these components with specific styling:
   - Lists: class="space-y-2 pl-5"
   - List items: class="flex items-start gap-2"
   - Tables: class="w-full border-collapse bg-indigo-500/5"
   - Table headers: class="p-2 text-left border border-indigo-500/20 text-indigo-300"
   - Table cells: class="p-2 border-b border-indigo-500/10"

7. Use these semantic colors for trading metrics:
   - Entry points: text-violet-300
   - Take profit targets: text-emerald-400
   - Stop loss levels: text-rose-400
   - Leverage: text-amber-400
   - Time duration: text-gray-200
   - Risk levels:
     * Low: text-emerald-400
     * Medium: text-amber-400
     * High: text-rose-400

8. Ensure all text is properly colored for dark mode (use text-gray-200 or text-white as base colors)

Format the following trading analysis with proper HTML and Tailwind classes:
"{input}"`;

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

async function getCoinData(userInput: string): Promise<CoinData | null> {
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
  rawRecommendation: string,
  model: ChatGoogleGenerativeAI
): Promise<string> {
  const formattingPrompt = ChatPromptTemplate.fromMessages([
    ["system", FORMATTING_PROMPT],
    ["human", "{input}"],
  ]);

  const formattingChain = formattingPrompt.pipe(model);

  const formattedResponse = await formattingChain.invoke({
    input: rawRecommendation,
  });

  return formattedResponse.content;
}

async function generateTradingRecommendation(
  coinData: CoinData,
  chatHistory: { role: string; content: string }[],
  model: ChatGoogleGenerativeAI,
  lastMessage: string
): Promise<string> {
  const finalInput = `${lastMessage}\n\nCurrent market data for ${
    coinData.name
  } (${coinData.symbol}${coinData.baseSymbol ? "/" + coinData.baseSymbol : ""}):
- Price: $${coinData.price.toFixed(8)}
- 24h Change: ${coinData.change24h ? coinData.change24h.toFixed(2) : "N/A"}%`;

  const finalChain = ChatPromptTemplate.fromMessages([
    ["system", SAMARITAN_PROMPT],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]).pipe(model);

  const initialResponse = await finalChain.invoke({
    chat_history: chatHistory,
    input: finalInput,
  });

  return initialResponse.content;
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

    const rawRecommendation = await generateTradingRecommendation(
      coinData,
      chatHistory,
      model,
      lastMessage
    );
    const formattedRecommendation = await formatTradingRecommendation(
      rawRecommendation,
      model
    );

    return NextResponse.json({
      content: formattedRecommendation,
      rawContent: rawRecommendation,
    });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
