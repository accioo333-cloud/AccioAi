import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/llm";
import { AppError } from "@/lib/errors/AppError";
import { ChatResponse } from "@/types/api";

const TIMEOUT_MS = 30000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.prompt || typeof body.prompt !== "string") {
      throw new AppError("INVALID_INPUT", "Prompt is required and must be a string");
    }

    const provider = getProvider();
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError("TIMEOUT", "Request timeout")), TIMEOUT_MS)
    );

    const response = await Promise.race([
      provider.generateResponse(body.prompt),
      timeoutPromise,
    ]);

    return NextResponse.json<ChatResponse>({
      success: true,
      data: response,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json<ChatResponse>(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ChatResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
