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

    // Get user's wallet accounts
    // Note: This assumes you have a wallets table
    // If not, this would return empty array for now
    const { data: accounts, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // If wallets table doesn't exist, return empty array
      console.warn("Wallets table may not exist:", error);
      return NextResponse.json({ accounts: [] });
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error) {
    console.error("Get wallets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

