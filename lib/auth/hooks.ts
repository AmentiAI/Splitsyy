"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          setAuthState({
            user: null,
            loading: false,
            error: error.message,
          });
          return;
        }

        setAuthState({
          user: session?.user || null,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;
        
        setAuthState({
          user: null,
          loading: false,
          error: "Failed to get session",
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setAuthState({
          user: session?.user || null,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Optionally call the logout API endpoint for audit logging
      await fetch("/api/auth/logout", { method: "POST" });
      
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return { ...authState, logout };
}

export function useRequireAuth() {
  const { user, loading, error } = useAuth();

  return { user, loading, error };
}
