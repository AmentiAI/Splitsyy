import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase environment variables are missing!");
    console.error("Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
    // Continue with request but log error
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refreshing the auth token - wrap in try/catch to handle network errors gracefully
    try {
      await supabase.auth.getUser();
    } catch (authError) {
      // Log but don't block the request - network issues shouldn't break the app
      console.error("⚠️ Supabase auth error in middleware:", authError instanceof Error ? authError.message : "Unknown error");
      
      // Only log full error in development
      if (process.env.NODE_ENV === "development") {
        console.error("Full error:", authError);
      }
    }
  } catch (error) {
    // Catch any other errors in Supabase client creation
    console.error("❌ Error creating Supabase client in middleware:", error instanceof Error ? error.message : "Unknown error");
    // Continue with request even if Supabase fails
  }

  return supabaseResponse;
}

