import { createClient } from "@/lib/supabase/client";

export async function signUp(email: string, password: string, name: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
    credentials: "include", // Important: include cookies
  });

  const data = await response.json();

  if (!response.ok) {
    // Preserve error details if available
    const errorMessage = data.details 
      ? `${data.error}\n${data.details}`
      : data.error || "Registration failed";
    const error = new Error(errorMessage) as Error & { code?: string };
    error.code = data.code;
    throw error;
  }

  // If registration was successful and we have a session, set it on client
  if (data.user && data.session) {
    const supabase = createClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (sessionError) {
      console.error("Failed to set client session after registration:", sessionError);
      // Don't throw - registration was successful
    }
  }

  return data;
}

export async function signIn(email: string, password: string) {
  // First, try to sign in via the API (which sets server-side cookies)
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include", // Important: include cookies
  });

  const data = await response.json();

  if (!response.ok) {
    // Preserve error details if available
    const errorMessage = data.details 
      ? `${data.error}\n${data.details}`
      : data.error || "Login failed";
    const error = new Error(errorMessage) as Error & { code?: string };
    error.code = data.code;
    throw error;
  }

  // Also set the session on the client side to ensure it's available immediately
  if (data.session) {
    const supabase = createClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (sessionError) {
      console.error("Failed to set client session:", sessionError);
      // Don't throw - the server-side session should still work
    }
  }

  return data;
}

export async function signOut() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Logout failed");
  }

  // Clear any client-side state
  const supabase = createClient();
  await supabase.auth.signOut();

  return data;
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get user");
  }

  return data.user;
}

export async function updateUserProfile(updates: { name?: string; kyc_status?: string }) {
  const response = await fetch("/api/auth/user", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update profile");
  }

  return data.user;
}

export async function initiateOAuth(provider: "google" | "apple" | "github", redirectTo?: string) {
  const response = await fetch("/api/auth/oauth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider, redirectTo }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "OAuth initiation failed");
  }

  // Redirect to OAuth provider
  window.location.href = data.url;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return "An unexpected error occurred";
}
