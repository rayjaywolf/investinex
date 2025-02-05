import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import axios from "axios";

const SAMARITAN_PROMPT = `You are Samaritan, a specialized cryptocurrency investment advisor. Here's your operational framework:

1. **Initial Information Gathering** ❓:
   - Collect and analyze relevant data through web search
   - Wait for the price before providing any trading recommendations

2. **Trade Research Protocol** 📊:
   - For each trading recommendation, you must analyze current market conditions
   - Focus on identifying short-term trading opportunities (20 minutes to 8 hours)
   - Always consider market volatility and risk management
   - Base recommendations on technical analysis and market sentiment

3. **Trade Specification Requirements** 📝:
   - **Cryptocurrency Name** and **Current Price** 💰
   - **Leverage Recommendation** (range: x3 to x20) 🔍
   - **Precise Stop Loss Levels** ⚠️
   - **Clear Take Profit Targets** 🎯
   - **Estimated Trade Duration** ⏳
   - **Risk Assessment** 🔒

Please ensure that your responses are well-structured and easy to read, with appropriate spacing and formatting. Use emojis where necessary to enhance clarity and engagement! Don't forget to leave lines and add space😊
`;

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", SAMARITAN_PROMPT],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

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
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("[SEARCH_ERROR]", error);
    throw new Error("Failed to fetch search results");
  }
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-exp",
      maxRetries: 2,
      temperature: 0.8,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Format the chat history
    const chatHistory = messages
      .slice(0, -1) // Exclude the last message as it will be the input
      .filter((msg) => msg[0] !== "system")
      .map((msg) => ({
        role: msg[0],
        content: msg[1],
      }));

    const lastMessage = messages[messages.length - 1];

    // Fetch search results based on the last message
    const searchResults = await fetchSearchResults(lastMessage[1]);

    // Extract relevant information from search results
    const relevantInfo = searchResults.items
      ? searchResults.items.map((item) => item.snippet).join(" ")
      : "";

    // Create the chain
    const chain = chatPrompt.pipe(model);

    // Invoke the chain with the search results included
    const response = await chain.invoke({
      chat_history: chatHistory,
      input: `${lastMessage[1]} Based on the following information: ${relevantInfo}`,
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
