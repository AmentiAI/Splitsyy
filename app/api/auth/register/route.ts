import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validations/auth";
import { logAuditEvent } from "@/lib/supabase/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    const { email, password, name } = validatedData;

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // In development mode, auto-confirm email
    if (process.env.NODE_ENV === "development" && !authData.user.email_confirmed_at) {
      console.warn("⚠️  Development mode: Auto-confirming user email");
      const { error: confirmError } = await adminSupabase.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error("Email confirmation error:", confirmError);
      } else {
        console.log("✅ Email auto-confirmed in development mode");
      }
    }

    // Create user profile in our database
    const { error: profileError } = await adminSupabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        name,
        kyc_status: "not_started",
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      
      // Clean up auth user if profile creation failed
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(authData.user.id, "user_registered", "user", authData.user.id, {
      email,
      name,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name,
          emailConfirmed: authData.user.email_confirmed_at !== null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
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
