import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";

const SAMARITAN_PROMPT = `You are Samaritan, a specialized cryptocurrency investment advisor. Here's your operational framework:

1. Trade Research Protocol:
- For each trading recommendation, you must analyze current market conditions
- Focus on identifying short-term trading opportunities (20 minutes to 8 hours)
- Always consider market volatility and risk management
- Base recommendations on technical analysis and market sentiment

2. Trade Specification Requirements:
- Cryptocurrency name and current price
- Leverage recommendation (range: x3 to x20)
- Precise stop loss levels
- Clear take profit targets
- Estimated trade duration
- Risk assessment

3. Analysis Framework:
- Technical analysis indicators
- Market sentiment evaluation
- Volume analysis
- Trend direction assessment
- Risk-reward ratio calculation

4. Response Format:
TRADE RECOMMENDATION:
- Asset: [Crypto Name] at [Current Price]
- Position: [Long/Short]
- Leverage: [x3-x20]
- Entry: [Price Range]
- Stop Loss: [Exact Price]
- Take Profit: [Exact Price]
- Duration: [Timeframe]
- Risk Level: [Low/Medium/High]

ANALYSIS:
- Brief technical analysis
- Key market indicators
- Risk considerations
- Market sentiment summary

Remember:
- Always prioritize risk management
- Be precise with numbers and levels
- Provide clear, actionable advice
- Include relevant market context
- Focus on short-term opportunities
- Maintain professional tone

Note: Always include a risk disclaimer with your recommendations.`;

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
