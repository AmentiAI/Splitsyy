import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAuth() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        user: null,
        error: "Not authenticated",
      };
    }

    return {
      authenticated: true,
      user,
      error: null,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return {
      authenticated: false,
      user: null,
      error: "Authentication error",
    };
  }
}

export async function requireAuthResponse(request: NextRequest) {
  const auth = await requireAuth();
  
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  return null; // No response means auth passed
}

export function getAuthErrorResponse(message: string = "Not authenticated", status: number = 401) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}
