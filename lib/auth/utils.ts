import { createClient } from "@/lib/supabase/client";

export async function signUp(email: string, password: string, name: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
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
