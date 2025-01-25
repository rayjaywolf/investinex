import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      maxRetries: 2,
      temperature: 0.7,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const response = await model.invoke(messages);

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
