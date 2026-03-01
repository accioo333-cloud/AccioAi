import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { profession, content_categories } = body;

    if (!content_categories || content_categories.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Please select at least one interest" } },
        { status: 400 }
      );
    }

    // Save preferences
    const { error: prefError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        profession,
        content_categories,
        updated_at: new Date().toISOString(),
      });

    if (prefError) {
      throw prefError;
    }

    // Mark onboarding as complete
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preferences error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to save preferences" } },
      { status: 500 }
    );
  }
}
