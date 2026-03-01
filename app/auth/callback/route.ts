import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, hash } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  const supabase = await createClient();

  // Handle PKCE flow (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Handle implicit flow (hash fragment)
  // The hash will be handled by client-side JavaScript
  const requestUrl = request.url;
  if (requestUrl.includes('#')) {
    // Extract hash and convert to query params for server processing
    const hashPart = requestUrl.split('#')[1];
    if (hashPart && hashPart.includes('access_token')) {
      // Let the client handle this via supabase.auth.getSession()
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Error case - redirect to home
  return NextResponse.redirect(new URL("/", request.url));
}
