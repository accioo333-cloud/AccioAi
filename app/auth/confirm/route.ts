import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash,
    });

    if (!error) {
      // Redirect to home page after successful verification
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to home with error
  return NextResponse.redirect(`${origin}/?error=verification_failed`);
}

