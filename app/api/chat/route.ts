import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import axios from "axios";

// Main trading recommendation prompt.
const SAMARITAN_PROMPT = `You are Investinex, a specialized cryptocurrency investment advisor. Here's your operational framework:

1. **Initial Information Gathering** ❓:
   - Collect and analyze relevant data through web search.
   - Wait for the price before providing any trading recommendations.

2. **Trade Research Protocol** 📊:
   - For each trading recommendation, you must analyze current market conditions.
   - Focus on identifying short-term trading opportunities (20 minutes to 8 hours).
   - Always consider market volatility and risk management.
   - Base recommendations on technical analysis and market sentiment.

3. **Trade Specification Requirements** 📝:
   - **Cryptocurrency Name** and **Current Price** 💰.
   - **Leverage Recommendation** (range: x3 to x20) 🔍.
   - **Precise Stop Loss Levels** ⚠️.
   - **Clear Take Profit Targets** 🎯.
   - **Estimated Trade Duration** ⏳.
   - **Risk Assessment** 🔒.

Ensure that your responses are well-structured, easy to read, and include appropriate spacing, line breaks, and emojis for clarity.
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

// New helper function to fetch price from CoinGecko
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
    return null;
  }
}

// Helper function to extract the first URL from a text string.
function extractURL(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

// New helper function to detect and parse CoinGecko URLs
function extractCoinGeckoId(url: string): string | null {
  try {
    const coinGeckoRegex = /coingecko\.com\/en\/coins\/([a-zA-Z0-9-]+)/;
    const match = url.match(coinGeckoRegex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
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

    // STEP 1: Check if a link is present in the user's query.
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
        // Handle non-CoinGecko links as before
        try {
          const linkResponse = await axios.get(link);
          let pageText = linkResponse.data;
          // Strip HTML tags to extract plain text.
          pageText = pageText.replace(/<[^>]*>/g, " ");

          // Use a special extraction prompt to pull coin and price info from the page text.
          const linkExtractPrompt = ChatPromptTemplate.fromMessages([
            ["system", LINK_EXTRACTION_PROMPT],
            ["human", "{input}"],
          ]);
          const linkExtractChain = linkExtractPrompt.pipe(model);
          const extractionFromLink = await linkExtractChain.invoke({
            input: pageText,
          });
          const extractedInfo = extractionFromLink.content.trim();

          // Expecting a format like: "Coin: <coin_name>, Price: <current_price>"
          const coinMatch = extractedInfo.match(/Coin:\s*([^,]+)/i);
          const priceMatch = extractedInfo.match(/Price:\s*(.+)/i);
          coin = coinMatch ? coinMatch[1].trim() : "";
          priceInfo = priceMatch ? priceMatch[1].trim() : "";

          if (!coin) {
            return NextResponse.json({
              content:
                "I couldn't detect a valid cryptocurrency in the provided link. Please ensure the link contains cryptocurrency information.",
            });
          }

          // Append the extracted details to the original query.
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
      // Extract crypto info using the '$' prefix.
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
      const coinData = await fetchCoinGeckoPrice(coin);

      if (coinData) {
        finalInput = `${lastMessage[1]}\n\nCurrent market data for ${
          coinData.name
        } (${coinData.symbol}):
- Price: $${coinData.price.toFixed(2)}
- 24h Change: ${coinData.change24h.toFixed(2)}%`;
      } else {
        // Fall back to Google Custom Search if CoinGecko doesn't have the coin
        const cryptoQuery = `${coin} price cryptocurrency`;
        const searchResults = await fetchSearchResults(cryptoQuery);
        const relevantInfo = searchResults.items
          ? searchResults.items.map((item) => item.snippet).join(" ")
          : "No price information found.";

        finalInput = `${lastMessage[1]}\n\nBased on the following current price information for ${coin}: ${relevantInfo}`;
      }
    }

    // STEP 4: Generate the final trading recommendation.
    const finalChain = chatPrompt.pipe(model);
    const response = await finalChain.invoke({
      chat_history: chatHistory,
      input: finalInput,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
