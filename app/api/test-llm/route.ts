import { NextResponse } from "next/server";
import { processContentWithLLM } from "@/lib/automation/processor";

export async function GET() {
  try {
    const testTitle = "AI Revolution in Software Development";
    const testContent = "Artificial intelligence is transforming how developers write code. New AI tools can generate entire functions, debug errors, and suggest optimizations in real-time. Companies are investing billions in AI-powered development tools. Studies show AI can reduce coding time by 40%. However, concerns about code quality and security remain.";

    const result = await processContentWithLLM(testTitle, testContent);
    
    return NextResponse.json({
      success: true,
      result: result,
      apiKey: process.env.GROQ_API_KEY ? "Set" : "NOT SET",
      model: process.env.LLM_MODEL || "llama-3.1-8b-instant",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
