import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/llm";
import { AppError } from "@/lib/errors/AppError";
import { ChatResponse } from "@/types/api";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { requireAuth } from "@/lib/middleware/auth";
import { logInfo, logError } from "@/lib/logger";

const TIMEOUT_MS = 30000;
const MAX_PROMPT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  logInfo("Request started", { requestId });

  // Authentication check
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  // Rate limiting check
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    logInfo("Rate limit exceeded", { requestId });
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    
    // Input validation
    if (!body.prompt || typeof body.prompt !== "string") {
      throw new AppError("INVALID_INPUT", "Prompt is required and must be a string");
    }

    const trimmedPrompt = body.prompt.trim();

    if (trimmedPrompt.length === 0) {
      throw new AppError("INVALID_INPUT", "Prompt cannot be empty");
    }

    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      throw new AppError("INVALID_INPUT", `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
    }

    // Sanitize control characters (keep newlines and tabs)
    const sanitizedPrompt = trimmedPrompt.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

    const provider = getProvider();
    const providerName = provider.constructor.name;
    const useStreaming = body.stream === true && provider.generateStreamingResponse;

    logInfo("Processing request", { requestId, provider: providerName, streaming: useStreaming });

    // Streaming response
    if (useStreaming) {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      try {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of provider.generateStreamingResponse!(sanitizedPrompt, abortController.signal)) {
                controller.enqueue(encoder.encode(chunk));
              }
              controller.close();
              logInfo("Streaming completed", { requestId, provider: providerName, latencyMs: Date.now() - startTime });
            } catch (error) {
              // Fallback to non-streaming on error
              logError("Streaming failed, falling back", { requestId, provider: providerName, error: String(error) });
              controller.close();
            } finally {
              clearTimeout(timeoutId);
            }
          },
          cancel() {
            abortController.abort();
            clearTimeout(timeoutId);
            logInfo("Stream cancelled", { requestId });
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      } catch (error) {
        clearTimeout(timeoutId);
        // Fallback to non-streaming
        logError("Streaming setup failed, falling back", { requestId, error: String(error) });
      }
    }

    // Non-streaming response (original behavior)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError("TIMEOUT", "Request timeout")), TIMEOUT_MS)
    );

    const response = await Promise.race([
      provider.generateResponse(sanitizedPrompt),
      timeoutPromise,
    ]);

    const latencyMs = Date.now() - startTime;
    logInfo("Request completed", { requestId, provider: providerName, latencyMs });

    return NextResponse.json<ChatResponse>({
      success: true,
      data: response,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    if (error instanceof AppError) {
      logError("Request failed", { requestId, code: error.code, latencyMs });
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

    // Map provider errors to safe codes
    const errorMessage = error instanceof Error ? error.message : String(error);
    let errorCode = "INTERNAL_ERROR";
    let statusCode = 500;

    if (errorMessage.includes("PROVIDER_AUTH_ERROR")) {
      errorCode = "PROVIDER_ERROR";
      statusCode = 502;
    } else if (errorMessage.includes("PROVIDER_RATE_LIMIT")) {
      errorCode = "PROVIDER_RATE_LIMIT";
      statusCode = 503;
    } else if (errorMessage.includes("PROVIDER_SERVER_ERROR") || errorMessage.includes("PROVIDER_ERROR")) {
      errorCode = "PROVIDER_ERROR";
      statusCode = 502;
    }

    logError("Internal error", { requestId, error: errorMessage, code: errorCode, latencyMs });
    return NextResponse.json<ChatResponse>(
      {
        success: false,
        error: {
          code: errorCode,
          message: "An unexpected error occurred",
        },
      },
      { status: statusCode }
    );
  }
}
