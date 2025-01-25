import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";

const SAMARITAN_PROMPT = `You are Samaritan, a specialized cryptocurrency investment advisor. Here's your operational framework:

1. **Trade Research Protocol** 📊:
   - For each trading recommendation, you must analyze current market conditions.
   - Focus on identifying short-term trading opportunities (20 minutes to 8 hours).
   - Always consider market volatility and risk management.
   - Base recommendations on technical analysis and market sentiment.

2. **Trade Specification Requirements** 📝:
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

export async function POST(req: Request) {
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
      .filter((msg: [string, string]) => msg[0] !== "system")
      .map((msg: [string, string]) => ({
        role: msg[0],
        content: msg[1],
      }));

    const lastMessage = messages[messages.length - 1];

    // Create the chain
    const chain = chatPrompt.pipe(model);

    // Invoke the chain
    const response = await chain.invoke({
      chat_history: chatHistory,
      input: lastMessage[1],
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
