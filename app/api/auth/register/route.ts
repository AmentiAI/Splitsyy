import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validations/auth";
import { logAuditEvent } from "@/lib/supabase/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    let validatedData;
    try {
      validatedData = registerSchema.parse(body);
    } catch (validationError: any) {
      console.error("Validation error:", validationError);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationError.errors || validationError.message,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validatedData;

    // Additional email sanitization (remove any hidden characters)
    const sanitizedEmail = email
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width characters
      .replace(/\s+/g, "") // Remove any whitespace
      .toLowerCase()
      .trim();

    console.log("Registration attempt:", {
      originalEmail: email,
      sanitizedEmail,
      emailLength: sanitizedEmail.length,
    });

    // Validate email format one more time after sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      console.error("Invalid email format after sanitization:", sanitizedEmail);
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await adminSupabase
      .from("users")
      .select("id")
      .eq("email", sanitizedEmail)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking existing user:", checkError);
      return NextResponse.json(
        {
          error: "Failed to check user existence",
          details: checkError.message,
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth using Admin API (bypasses email validation issues)
    console.log("Attempting to create user with admin API:", sanitizedEmail);

    let authData: any = null;
    let authError: any = null;

    try {
      // Use admin API to create user (more reliable, bypasses some validation)
      const { data: adminUserData, error: adminError } =
        await adminSupabase.auth.admin.createUser({
          email: sanitizedEmail,
          password,
          email_confirm: process.env.NODE_ENV === "development", // Auto-confirm in dev
          user_metadata: {
            name,
          },
        });

      if (adminError) {
        console.error("Admin API error:", adminError);
        console.error(
          "Admin error details:",
          JSON.stringify(adminError, null, 2)
        );

        // If admin API fails, try regular signup as fallback
        console.log("Falling back to regular signup...");
        const signupResult = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            data: {
              name,
            },
          },
        });
        authData = signupResult.data;
        authError = signupResult.error;
      } else {
        // Admin API succeeded
        authData = {
          user: adminUserData.user,
          session: null, // Admin API doesn't return session, we'll create one
        };
        authError = null;
        console.log("✅ User created via admin API");

        // Generate a session for the user in dev mode
        if (process.env.NODE_ENV === "development") {
          const { data: sessionData } =
            await adminSupabase.auth.admin.generateLink({
              type: "magiclink",
              email: sanitizedEmail,
            });
          console.log("Session link generated for dev mode");
        }
      }
    } catch (adminException: any) {
      console.error("Exception in admin API:", adminException);
      // Fall back to regular signup
      console.log("Falling back to regular signup due to exception...");
      const signupResult = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      authData = signupResult.data;
      authError = signupResult.error;
    }

    if (authError) {
      console.error("Auth signup error:", authError);
      console.error("Auth error code:", authError.status);
      console.error("Auth error message:", authError.message);
      console.error("Full error object:", JSON.stringify(authError, null, 2));

      // Check if email might have encoding issues
      const emailBytes = Buffer.from(sanitizedEmail, "utf8");
      console.error("Email bytes:", Array.from(emailBytes));
      console.error("Email length:", sanitizedEmail.length);
      console.error(
        "Email char codes:",
        Array.from(sanitizedEmail).map((c) => c.charCodeAt(0))
      );

      // Provide more specific error messages
      let errorMessage = "Failed to create account";
      if (authError.message.includes("invalid")) {
        errorMessage = `Email validation failed: ${authError.message}`;
      } else if (
        authError.message.includes("already registered") ||
        authError.message.includes("already exists")
      ) {
        errorMessage = "An account with this email already exists";
      } else if (authError.message.includes("password")) {
        errorMessage = "Password does not meet requirements";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: authError.message,
          code: authError.status,
          debug: {
            emailReceived: sanitizedEmail,
            emailLength: sanitizedEmail.length,
          },
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // Ensure email is confirmed (admin API might not auto-confirm)
    if (!authData.user.email_confirmed_at) {
      console.warn("⚠️  User email not confirmed, confirming now...");
      const { error: confirmError } =
        await adminSupabase.auth.admin.updateUserById(authData.user.id, {
          email_confirm: true,
        });

      if (confirmError) {
        console.error("Email confirmation error:", confirmError);
      } else {
        console.log("✅ Email confirmed");
        // Refresh user data
        const { data: updatedUser } =
          await adminSupabase.auth.admin.getUserById(authData.user.id);
        if (updatedUser?.user) {
          authData.user = updatedUser.user;
        }
      }
    }

    // Create user profile in our database
    const { error: profileError } = await adminSupabase.from("users").insert({
      id: authData.user.id,
      email: sanitizedEmail, // Use sanitized email
      name,
      kyc_status: "not_started",
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      console.error(
        "Profile error details:",
        JSON.stringify(profileError, null, 2)
      );

      // Clean up auth user if profile creation failed
      try {
        await adminSupabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }

      return NextResponse.json(
        {
          error: "Failed to create user profile",
          details: profileError.message,
          code: profileError.code,
        },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent(
      authData.user.id,
      "user_registered",
      "user",
      authData.user.id,
      {
        email: sanitizedEmail,
        name,
      }
    );

    // Return session if available (for auto-login after registration in dev mode)
    const responseData: any = {
      message: "Account created successfully",
      user: {
        id: authData.user.id,
        email: sanitizedEmail,
        name,
        emailConfirmed: authData.user.email_confirmed_at !== null,
      },
    };

    // Include session if available (for development mode auto-confirmation)
    if (authData.session) {
      responseData.session = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      };
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Invalid input data", details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Internal server error",
          details: error.message,
          name: error.name,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
