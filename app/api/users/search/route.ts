import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    // Search for user by email
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error("Error searching for user:", error);
      return NextResponse.json({ error: "Failed to search for user" }, { status: 500 });
    }

    if (!users) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: users });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

