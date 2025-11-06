"use client";

import { useAuth } from "@/lib/auth/hooks";

export function DebugAuth() {
  const { user, loading, error } = useAuth();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <div>Loading: {loading ? "true" : "false"}</div>
      <div>User: {user ? user.email : "null"}</div>
      <div>Error: {error || "none"}</div>
      <div>User ID: {user?.id || "null"}</div>
    </div>
  );
}













