import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { logInfo, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  logInfo("Onboarding request started", { requestId });

  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  try {
    const body = await request.json();
    const { full_name } = body;

    if (!full_name || typeof full_name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Full name is required",
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: full_name.trim(),
        avatar_url: user.user_metadata?.avatar_url || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logError("Onboarding failed", { requestId, error: error.message });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to complete onboarding",
          },
        },
        { status: 500 }
      );
    }

    logInfo("Onboarding completed", { requestId, userId: user.id });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logError("Onboarding error", { requestId, error: String(error) });
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

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch profile",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch {
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
