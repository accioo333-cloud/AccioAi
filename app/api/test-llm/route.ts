import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/llm";

export async function GET() {
  try {
    const testPrompt = `Summarize this in 2 sentences:

Title: AI Revolution in Software Development

Content: Artificial intelligence is transforming how developers write code. New AI tools can generate entire functions, debug errors, and suggest optimizations in real-time.

Format:
SUMMARY:
[Your summary here]

INSIGHTS:
- [Insight 1]
- [Insight 2]
- [Insight 3]

ACTION:
[Action here]`;

    const response = await generateResponse(testPrompt);
    
    return NextResponse.json({
      success: true,
      prompt: testPrompt,
      response: response,
      apiKey: process.env.GROQ_API_KEY ? "Set (hidden)" : "NOT SET",
      model: process.env.LLM_MODEL || "llama-3.1-8b-instant",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      apiKey: process.env.GROQ_API_KEY ? "Set (hidden)" : "NOT SET",
    }, { status: 500 });
  }
}
