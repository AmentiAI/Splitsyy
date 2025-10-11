import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user before logout
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("User fetch error:", userError);
      return NextResponse.json(
        { error: "Failed to get user information" },
        { status: 500 }
      );
    }

    // Log logout event
    if (user) {
      await logAuditEvent(user.id, "logout", "auth", user.id, {
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    }

    // Sign out
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Logout error:", signOutError);
      return NextResponse.json(
        { error: "Failed to logout" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
