import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { logInfo, logError } from "@/lib/logger";

const VALID_INTERACTION_TYPES = ["view", "like", "bookmark", "complete"];

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  logInfo("Interaction request started", { requestId });

  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  try {
    const body = await request.json();
    const { card_id, interaction_type } = body;

    if (!card_id || typeof card_id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Card ID is required",
          },
        },
        { status: 400 }
      );
    }

    if (!VALID_INTERACTION_TYPES.includes(interaction_type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid interaction type",
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_interactions")
      .insert({
        user_id: user.id,
        card_id,
        interaction_type,
      })
      .select()
      .single();

    if (error) {
      logError("Interaction failed", { requestId, error: error.message });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to record interaction",
          },
        },
        { status: 500 }
      );
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const statField = interaction_type === 'view' ? 'cards_viewed' :
                      interaction_type === 'like' ? 'cards_liked' :
                      interaction_type === 'bookmark' ? 'cards_saved' : 'cards_completed';
    
    // Upsert daily stats
    await supabase.from('daily_stats').upsert({
      user_id: user.id,
      date: today,
      [statField]: 1,
    }, { 
      onConflict: 'user_id,date',
      ignoreDuplicates: false 
    });

    // Update streak
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('last_activity_date, current_streak, longest_streak')
      .eq('user_id', user.id)
      .single();

    if (prefs) {
      const lastDate = prefs.last_activity_date ? new Date(prefs.last_activity_date) : null;
      const todayDate = new Date(today);
      let newStreak = prefs.current_streak || 0;

      if (!lastDate || lastDate.toISOString().split('T')[0] !== today) {
        // New day
        const daysDiff = lastDate ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        if (daysDiff === 1) {
          newStreak += 1; // Continue streak
        } else if (daysDiff > 1) {
          newStreak = 1; // Reset streak
        }

        await supabase
          .from('user_preferences')
          .update({
            last_activity_date: today,
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, prefs.longest_streak || 0),
          })
          .eq('user_id', user.id);
      }
    }

    logInfo("Interaction recorded", { requestId, userId: user.id, cardId: card_id, type: interaction_type });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logError("Interaction error", { requestId, error: String(error) });
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

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("card_id");
    const interactionType = searchParams.get("interaction_type");

    let query = supabase
      .from("user_interactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (cardId) {
      query = query.eq("card_id", cardId);
    }

    if (interactionType) {
      query = query.eq("interaction_type", interactionType);
    }

    const { data, error } = await query;

    if (error) {
      logError("Fetch interactions failed", { requestId, error: error.message });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch interactions",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    logError("Fetch interactions error", { requestId, error: String(error) });
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

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  try {
    const body = await request.json();
    const { card_id, interaction_type } = body;

    const { error } = await supabase
      .from("user_interactions")
      .delete()
      .eq("user_id", user.id)
      .eq("card_id", card_id)
      .eq("interaction_type", interaction_type);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "DATABASE_ERROR", message: "Failed to delete interaction" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
