import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user preferences with streak data
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", user.id)
      .single();

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const { data: todayStats } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: prefs?.current_streak || 0,
        longestStreak: prefs?.longest_streak || 0,
        todayStats: todayStats || {
          cards_viewed: 0,
          cards_liked: 0,
          cards_saved: 0,
          cards_completed: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
