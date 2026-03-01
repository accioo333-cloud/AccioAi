import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  // Check onboarding
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_completed) {
    return NextResponse.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  return NextResponse.redirect(new URL("/feed", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
