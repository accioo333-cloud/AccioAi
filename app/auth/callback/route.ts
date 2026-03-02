import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") || "/feed";

  console.log("=== OAuth Callback ===");
  console.log("Code:", code ? "Present" : "Missing");
  console.log("Error:", error_description || "None");
  console.log("Full URL:", request.url);

  // Log OAuth errors
  if (error_description) {
    console.error("OAuth error:", error_description);
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url));
  }

  if (code) {
    console.log("Exchanging code for session...");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Session exchange error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.redirect(new URL("/?error=session_failed", request.url));
    }

    if (data.session) {
      console.log("✅ Session created successfully");
      console.log("User ID:", data.user?.id);
      console.log("User email:", data.user?.email);
      console.log("Session expires at:", data.session.expires_at);
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error("❌ No session in response");
      console.error("Data:", JSON.stringify(data, null, 2));
      return NextResponse.redirect(new URL("/?error=no_session", request.url));
    }
  }

  // No code provided
  console.error("❌ No code in callback");
  return NextResponse.redirect(new URL("/?error=no_code", request.url));
}
