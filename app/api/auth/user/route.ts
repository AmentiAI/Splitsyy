import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User fetch error:", userError);
      return NextResponse.json(
        { error: "Failed to get user information" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile - create if it doesn't exist (fallback for users created outside normal flow)
    const { data: initialProfile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, kyc_status, created_at, updated_at")
      .eq("id", user.id)
      .single();
    let profile = initialProfile;

    // If profile doesn't exist, create it (fallback for users created before profile table existed)
    if (profileError && profileError.code === "PGRST116") {
      console.warn("User profile not found, creating profile...");
      const adminSupabase = createAdminClient();
      const { data: newProfile, error: createError } = await adminSupabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          kyc_status: "not_started",
        })
        .select("id, name, email, kyc_status, created_at, updated_at")
        .single();

      if (createError || !newProfile) {
        console.error("Failed to create user profile:", createError);
        return NextResponse.json(
          { error: "Failed to load user profile" },
          { status: 500 }
        );
      }
      profile = newProfile;
    } else if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to load user profile", details: profileError.message },
        { status: 500 }
      );
    }

    // Ensure profile exists before using it
    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: profile.name,
          kyc_status: profile.kyc_status,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          emailConfirmed: user.email_confirmed_at !== null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Validate and update user profile
    const { name, kyc_status } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (kyc_status !== undefined) updateData.kyc_status = kyc_status;

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Get updated profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, kyc_status, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to load updated profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          id: user.id,
          email: user.email,
          name: profile.name,
          kyc_status: profile.kyc_status,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          emailConfirmed: user.email_confirmed_at !== null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
