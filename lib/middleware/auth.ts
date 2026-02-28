import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChatResponse } from "@/types/api";

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json<ChatResponse>(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      },
      { status: 401 }
    );
  }

  return { user, supabase };
}
