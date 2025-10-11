import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    if (error) {
      console.error("OAuth callback error:", error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=no_code`
      );
    }

    const supabase = await createClient();

    // Exchange code for session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error("Code exchange error:", authError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=exchange_failed`
      );
    }

    if (!authData.user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=no_user`
      );
    }

    // Check if user profile exists, create if not
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    if (!existingProfile) {
      // Create user profile for OAuth users
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.full_name || 
                authData.user.user_metadata?.name || 
                authData.user.email?.split("@")[0] || 
                "User",
          kyc_status: "not_started",
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Continue anyway - profile can be created later
      }

      // Log OAuth user creation
      await logAuditEvent(authData.user.id, "oauth_user_created", "user", authData.user.id, {
        provider: authData.user.app_metadata?.provider,
        email: authData.user.email,
      });
    }

    // Log successful OAuth login
    await logAuditEvent(authData.user.id, "oauth_login_success", "auth", authData.user.id, {
      provider: authData.user.app_metadata?.provider,
      email: authData.user.email,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Redirect to dashboard or intended page
    const redirectTo = requestUrl.searchParams.get("redirect_to") || "/dashboard";
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=callback_failed`
    );
  }
}
