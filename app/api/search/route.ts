import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get user preferences for personalization
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("content_categories")
      .eq("user_id", user.id)
      .single();

    const userCategories = preferences?.content_categories || [];

    // Get viewed card IDs
    const { data: interactions } = await supabase
      .from("user_interactions")
      .select("card_id")
      .eq("user_id", user.id);

    const viewedCardIds = interactions?.map((i) => i.card_id) || [];

    // Build query
    let dbQuery = supabase
      .from("content_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by category if specified
    if (category && category !== "all") {
      dbQuery = dbQuery.eq("category", category);
    } else if (userCategories.length > 0) {
      // Filter by user preferences
      dbQuery = dbQuery.in("category", userCategories);
    }

    // Search by title or content
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    // Exclude viewed cards
    if (viewedCardIds.length > 0) {
      dbQuery = dbQuery.not("id", "in", `(${viewedCardIds.join(",")})`);
    }

    const { data: cards, error } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        cards: cards || [],
        total: cards?.length || 0,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
