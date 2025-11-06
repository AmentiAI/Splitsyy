import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";
import { logAuditEvent } from "@/lib/supabase/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    const supabase = await createClient();

    // Attempt to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("Login error:", authError);
      
      // Log failed login attempt (only if not a connection error)
      if (!authError.message?.includes("fetch failed")) {
        try {
          await logAuditEvent(null, "login_failed", "auth", null, {
            email,
            error: authError.message,
            code: authError.code,
            ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
            userAgent: request.headers.get("user-agent") || "unknown",
          });
        } catch (logError) {
          console.error("Failed to log audit event:", logError);
        }
      }

      // Handle specific error cases
      if (authError.status === 400 && authError.code === "email_not_confirmed") {
        // In development, allow unconfirmed emails to proceed
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️  Development mode: Allowing login with unconfirmed email");
          // Don't return error, continue with the flow
        } else {
          return NextResponse.json(
            { 
              error: "Please verify your email address",
              details: "Check your inbox for a confirmation link. If you didn't receive it, you can request a new one.",
              code: "email_not_confirmed"
            },
            { status: 400 }
          );
        }
      }

      // Check for connection errors
      if (authError.message?.includes("fetch failed") || authError.message?.includes("NetworkError")) {
        console.error("❌ Supabase connection error - check environment variables");
        return NextResponse.json(
          { 
            error: "Connection error",
            details: "Unable to connect to authentication service. Please check your internet connection or try again later.",
            code: "connection_error"
          },
          { status: 503 }
        );
      }

      // Generic authentication error
      return NextResponse.json(
        { 
          error: "Invalid email or password",
          details: "Please check your credentials and try again.",
          code: authError.code || "invalid_credentials"
        },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Login failed" },
        { status: 500 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, kyc_status, created_at")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to load user profile" },
        { status: 500 }
      );
    }

    // Log successful login
    await logAuditEvent(authData.user.id, "login_success", "auth", authData.user.id, {
      email,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: profile.name,
          kyc_status: profile.kyc_status,
          created_at: profile.created_at,
          emailConfirmed: authData.user.email_confirmed_at !== null,
        },
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
