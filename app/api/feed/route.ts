import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { logInfo, logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  logInfo("Feed request started", { requestId });

  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { supabase } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("content_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query;

    if (error) {
      logError("Feed fetch failed", { requestId, error: error.message });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch content",
          },
        },
        { status: 500 }
      );
    }

    logInfo("Feed fetched", { requestId, count: data?.length || 0 });
    return NextResponse.json({
      success: true,
      data: {
        cards: data || [],
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    logError("Feed error", { requestId, error: String(error) });
    return NextResponse.json(
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
