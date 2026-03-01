import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  try {
    // Get bookmarked card IDs
    const { data: interactions } = await supabase
      .from("user_interactions")
      .select("card_id")
      .eq("user_id", user.id)
      .eq("interaction_type", "bookmark");

    if (!interactions || interactions.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const cardIds = interactions.map(i => i.card_id);

    // Get the actual cards
    const { data: cards, error } = await supabase
      .from("content_cards")
      .select("*")
      .in("id", cardIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "DATABASE_ERROR", message: "Failed to fetch saved cards" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: cards || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
