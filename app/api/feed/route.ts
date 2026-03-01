import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { logInfo, logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  logInfo("Feed request started", { requestId });

  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("content_categories")
      .eq("user_id", user.id)
      .single();

    const userCategories = preferences?.content_categories || [];

    // Get cards user has already interacted with
    const { data: interactions } = await supabase
      .from("user_interactions")
      .select("card_id")
      .eq("user_id", user.id);

    const viewedCardIds = interactions?.map(i => i.card_id) || [];

    // Build query to exclude viewed cards
    let query = supabase
      .from("content_cards")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by viewed cards
    if (viewedCardIds.length > 0) {
      query = query.not("id", "in", `(${viewedCardIds.join(",")})`);
    }

    // Filter by user preferences (if they have any)
    if (userCategories.length > 0) {
      query = query.in("category", userCategories);
    }

    // Override with specific category if requested
    if (category) {
      query = query.eq("category", category);
    }

    query = query.range(offset, offset + limit - 1);

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
