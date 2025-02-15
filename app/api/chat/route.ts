import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import axios from "axios";
import { trackCoinSearch } from "@/lib/coins";

// Main trading recommendation prompt.
const SAMARITAN_PROMPT = `You are Investinex, a specialized cryptocurrency investment advisor. You already have all the necessary market data, so provide immediate analysis without any waiting messages. Here's your operational framework:

1. **Analysis Protocol** 📊:
   - Analyze the provided market data and current conditions
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

Format your response in a clear, structured manner with appropriate spacing and emojis for better readability.`;

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

// Create the chain for generating the final trading recommendation.
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", SAMARITAN_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// Create the chain for extracting the crypto name from non-link queries.
const extractPrompt = ChatPromptTemplate.fromMessages([
  ["system", EXTRACT_PROMPT],
  ["human", "{input}"],
]);

// Helper function to fetch search results via Google Custom Search.
async function fetchSearchResults(query) {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  const url = "https://www.googleapis.com/customsearch/v1";

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

// Helper function to fetch price from CoinGecko
async function fetchCoinGeckoPrice(coinId: string) {
  try {
    // First try to get the coin ID if a symbol was provided
    const searchResponse = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${coinId}`
    );

    const coinMatch = searchResponse.data.coins?.[0];
    if (!coinMatch) {
      return null;
    }

    // Get the current price using the coin ID
    const priceResponse = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinMatch.id}&vs_currencies=usd&include_24hr_change=true`
    );

    if (priceResponse.data[coinMatch.id]) {
      const data = priceResponse.data[coinMatch.id];

      // Track the search
      try {
        await trackCoinSearch(coinMatch.name, coinMatch.symbol);
      } catch (error) {
        console.error("[SEARCH_TRACKING_ERROR]:", error);
      }

      return {
        name: coinMatch.name,
        symbol: coinMatch.symbol.toUpperCase(),
        price: data.usd,
        change24h: data.usd_24h_change,
      };
    }
    return null;
  } catch (error) {
    console.error("[COINGECKO_ERROR]", error);
    return null; // Return null on error, don't throw
  }
}

// Helper function to fetch price from Dexscreener
async function fetchDexscreenerPrice(
  tokenSymbol: string,
  baseSymbol: string
) {
  try {
    // Fetch the pair data from Dexscreener
    const pairResponse = await axios.get(
      `https://api.dexscreener.com/latest/dex/search?q=${tokenSymbol}/${baseSymbol}`
    );
    const pairs = pairResponse.data.pairs;

    if (!pairs || pairs.length === 0) {
      return null;
    }

    // Find the pair with the highest liquidity.
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

    // Convert price to USD if necessary
    let priceUsd = parseFloat(bestPair.priceNative);
    if (bestPair.quoteToken.symbol.toUpperCase() !== "USDC") {
      // Fetch the current price of the quote token in USD (e.g., SOL)
      const quoteTokenPriceResponse = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${bestPair.quoteToken.address}`
      );

      const quoteTokenPairs = quoteTokenPriceResponse.data.pairs;

      if (!quoteTokenPairs || quoteTokenPairs.length === 0) {
        return null; // Or throw an error, depending on your needs
      }

      // Find a liquid USD pair for the quote token
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
        return null; // Could not find a USD pair for the quote token
      }

      const quoteTokenPriceUsd = parseFloat(usdQuotePair.priceNative);
      priceUsd *= quoteTokenPriceUsd; // Convert to USD
    }

    return {
      name: bestPair.baseToken.name,
      symbol: bestPair.baseToken.symbol.toUpperCase(),
      price: priceUsd,
      change24h: bestPair.priceChange.h24,
      baseSymbol: bestPair.quoteToken.symbol.toUpperCase(), // Now using quoteToken as base
      pairAddress: bestPair.pairAddress,
    };
  } catch (error) {
    console.error("[DEXSCREENER_ERROR]", error);
    return null; // Return null on error
  }
}

// Helper function to extract the first URL from a text string.
function extractURL(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

// Helper function to detect and parse CoinGecko URLs
function extractCoinGeckoId(url: string): string | null {
  try {
    const coinGeckoRegex = /coingecko\.com\/en\/coins\/([a-zA-Z0-9-]+)/;
    const match = url.match(coinGeckoRegex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

// New helper function to detect and parse Dexscreener URLs and pairs
function extractDexscreenerPair(text: string): { token: string; base: string } | null {
    const dexscreenerUrlRegex = /dexscreener\.com\/[a-zA-Z0-9]+\/([a-zA-Z0-9]+)/;
    const urlMatch = text.match(dexscreenerUrlRegex);

    if (urlMatch) {
        // If it's a Dexscreener URL, try to extract pair address and fetch directly
        return { token: urlMatch[1], base: "DIRECT" }; // Special case for direct links
    }

    const pairRegex = /\$([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/;
    const match = text.match(pairRegex);
    if (match) {
        return { token: match[1], base: match[2] };
    }
    return null;
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Initialize the AI model.
    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      maxRetries: 2,
      temperature: 0.8,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Prepare chat history (excluding system messages).
    const chatHistory = messages
      .slice(0, -1)
      .filter((msg) => msg[0] !== "system")
      .map((msg) => ({ role: msg[0], content: msg[1] }));

    const lastMessage = messages[messages.length - 1];
    let finalInput = lastMessage[1];
    let coin = "";
    let priceInfo = "";

    // Check if the input is a Dexscreener pair or URL
    const dexscreenerPair = extractDexscreenerPair(lastMessage[1]);

    if (dexscreenerPair) {
      const { token, base } = dexscreenerPair;
      let coinData = null;
      if (base === "DIRECT") {
        // Extract chain and address from dexscreener link
        const dexscreenerUrlRegex = /dexscreener\.com\/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/;
        const urlMatch = lastMessage[1].match(dexscreenerUrlRegex);
        if (urlMatch) {
          const chain = urlMatch[1];
          const pairAddress = urlMatch[2];

          // Fetch pair directly using the pair address
          const pairResponse = await axios.get(
            `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`
          );
          const pair = pairResponse.data.pair;

          if (pair) {
            // Convert price to USD if necessary
            let priceUsd = parseFloat(pair.priceNative);
            if (pair.quoteToken.symbol.toUpperCase() !== "USDC") {
              const quoteTokenPriceResponse = await axios.get(
                `https://api.dexscreener.com/latest/dex/tokens/${pair.quoteToken.address}`
              );

              const quoteTokenPairs = quoteTokenPriceResponse.data.pairs;

              if (!quoteTokenPairs || quoteTokenPairs.length === 0) {
                return NextResponse.json({
                  content:
                    "Unable to fetch USD price for the quote token.",
                });
              }

              // Find a liquid USD pair for the quote token
              let usdQuotePair = null;
              for (const quotePair of quoteTokenPairs) {
                if (
                  quotePair.quoteToken.symbol.toUpperCase() === "USDC"
                ) {
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
                return NextResponse.json({
                  content:
                    "Could not find a USD pair for the quote token.",
                });
              }

              const quoteTokenPriceUsd = parseFloat(
                usdQuotePair.priceNative
              );
              priceUsd *= quoteTokenPriceUsd; // Convert to USD
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

      if (coinData) {
        finalInput = `${lastMessage[1]}\n\nCurrent market data for ${
          coinData.name
        } (${coinData.symbol}/${coinData.baseSymbol}):
- Price: $${coinData.price.toFixed(6)}
- 24h Change: ${coinData.change24h ? coinData.change24h.toFixed(2) : "N/A"}%`;
      } else {
        return NextResponse.json({
          content:
            "Unable to fetch data for this cryptocurrency pair from Dexscreener.",
        });
      }
    } else {
      // Existing logic for CoinGecko and other links
      const link = extractURL(lastMessage[1]);
      if (link) {
        // Check if it's a CoinGecko link
        const coinGeckoId = extractCoinGeckoId(link);

        if (coinGeckoId) {
          // Direct CoinGecko API call
          const coinData = await fetchCoinGeckoPrice(coinGeckoId);
          if (coinData) {
            finalInput = `${lastMessage[1]}\n\nCurrent market data for ${
              coinData.name
            } (${coinData.symbol}):
- Price: $${coinData.price.toFixed(2)}
- 24h Change: ${coinData.change24h.toFixed(2)}%`;
          } else {
            return NextResponse.json({
              content:
                "Unable to fetch data for this cryptocurrency from CoinGecko.",
            });
          }
        } else {
          // Handle non-CoinGecko links
          try {
            const linkResponse = await axios.get(link);
            let pageText = linkResponse.data;
            // Strip HTML tags
            pageText = pageText.replace(/<[^>]*>/g, " ");

            // Use extraction prompt
            const linkExtractPrompt = ChatPromptTemplate.fromMessages([
              ["system", LINK_EXTRACTION_PROMPT],
              ["human", "{input}"],
            ]);
            const linkExtractChain = linkExtractPrompt.pipe(model);
            const extractionFromLink = await linkExtractChain.invoke({
              input: pageText,
            });
            const extractedInfo = extractionFromLink.content.trim();

            const coinMatch = extractedInfo.match(/Coin:\s*([^,]+)/i);
            const priceMatch = extractedInfo.match(/Price:\s*(.+)/i);
            coin = coinMatch ? coinMatch[1].trim() : "";
            priceInfo = priceMatch ? priceMatch[1].trim() : "";

            if (!coin) {
              return NextResponse.json({
                content:
                  "I couldn't detect a valid cryptocurrency in the provided link.",
              });
            }

            finalInput = `${lastMessage[1]}\n\nBased on the information extracted from the link: Coin: ${coin}, Price: ${priceInfo}.`;
          } catch (error) {
            console.error("[LINK_FETCH_ERROR]", error);
            return NextResponse.json({
              content:
                "Unable to fetch data from the provided link. Please ensure the link is accessible.",
            });
          }
        }
      } else {
        // Extract using the '$' prefix.
        const extractChain = extractPrompt.pipe(model);
        const extractionResponse = await extractChain.invoke({
          input: lastMessage[1],
        });
        let cryptoSymbols = extractionResponse.content.trim();

        if (cryptoSymbols.toLowerCase() !== "none" && cryptoSymbols !== "") {
          const symbolsArray = cryptoSymbols.split(/[\s,]+/);
          coin = symbolsArray[0];
          if (coin.startsWith("$")) {
            coin = coin.substring(1);
          }
        }

        if (!coin) {
          return NextResponse.json({
            content:
              "I couldn't detect a valid cryptocurrency in your query. Please prefix the cryptocurrency name with a '$' sign (e.g., '$bitcoin') or enter a coingecko link and try again.",
          });
        }

        // Try CoinGecko first
        let coinData = await fetchCoinGeckoPrice(coin);

        // Dexscreener fallback, and Google fallback
        if (!coinData) {
            coinData = await fetchDexscreenerPrice(coin, "USDC"); // Try Dexscreener
        }

        if (coinData) {
          finalInput = `${lastMessage[1]}\n\nCurrent market data for ${
            coinData.name
          } (${coinData.symbol}${coinData.baseSymbol ? "/" + coinData.baseSymbol : ""}):
- Price: $${coinData.price.toFixed(coinData.baseSymbol ? 6 : 2)}
- 24h Change: ${coinData.change24h ? coinData.change24h.toFixed(2) : "N/A"}%`;
        } else {
          // Fall back to Google Custom Search ONLY if both fail
          const cryptoQuery = `${coin} price cryptocurrency`;
          const searchResults = await fetchSearchResults(cryptoQuery);
          const relevantInfo = searchResults.items
            ? searchResults.items
                .map((item) => item.snippet)
                .join(" ")
            : "No price information found.";

          finalInput = `${lastMessage[1]}\n\nBased on the following current price information for ${coin}: ${relevantInfo}`;

        }
      }
    }

    // Generate the initial trading recommendation
    const finalChain = chatPrompt.pipe(model);
    const initialResponse = await finalChain.invoke({
      chat_history: chatHistory,
      input: finalInput,
    });

    // Create formatting prompt chain
    const formattingPrompt = ChatPromptTemplate.fromMessages([
      ["system", FORMATTING_PROMPT],
      ["human", "{input}"],
    ]);
    
    const formattingChain = formattingPrompt.pipe(model);
    
    // Get formatted response
    const formattedResponse = await formattingChain.invoke({
      input: initialResponse.content,
    });

    return NextResponse.json({ 
      content: formattedResponse.content,
      rawContent: initialResponse.content // Include raw content for reference if needed
    });

  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
