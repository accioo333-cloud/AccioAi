import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") || "/feed";

  // Log OAuth errors
  if (error_description) {
    console.error("OAuth error:", error_description);
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url));
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Session exchange error:", error);
      return NextResponse.redirect(new URL("/?error=session_failed", request.url));
    }

    if (data.session) {
      console.log("Session created successfully for user:", data.user?.email);
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // No code provided
  return NextResponse.redirect(new URL("/?error=no_code", request.url));
}
