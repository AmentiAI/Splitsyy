import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, redirectTo } = body;

    // Validate provider
    const validProviders = ["google", "apple", "github"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid OAuth provider" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get OAuth URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "apple" | "github",
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.json(
        { error: "Failed to initiate OAuth login" },
        { status: 500 }
      );
    }

    if (!data.url) {
      return NextResponse.json(
        { error: "OAuth URL generation failed" },
        { status: 500 }
      );
    }

    // Log OAuth initiation
    await logAuditEvent(null, "oauth_initiated", "auth", null, {
      provider,
      redirectTo,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(
      {
        url: data.url,
        provider,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
