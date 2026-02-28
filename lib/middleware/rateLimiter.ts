import { NextRequest, NextResponse } from "next/server";
import { ChatResponse } from "@/types/api";

// In-memory rate limiter
// NOTE: This is acceptable for demo/development purposes only.
// PRODUCTION: Use Redis or similar distributed cache to:
// - Share state across multiple server instances
// - Persist limits across server restarts
// - Scale horizontally without losing rate limit state
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT = 5;
const WINDOW_MS = 60000; // 1 minute

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.timestamp > WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || now - record.timestamp > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return null;
  }

  if (record.count >= RATE_LIMIT) {
    return NextResponse.json<ChatResponse>(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests",
        },
      },
      { status: 429 }
    );
  }

  record.count++;
  return null;
}
