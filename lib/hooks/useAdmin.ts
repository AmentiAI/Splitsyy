"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/hooks";

interface AdminStatus {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (authLoading || !user) {
      setAdminStatus({ isAdmin: false, loading: authLoading, error: null });
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        const isAdmin = data.user?.is_platform_admin === true;

        setAdminStatus({ isAdmin, loading: false, error: null });
      } catch (error) {
        console.error("Error checking admin status:", error);
        setAdminStatus({
          isAdmin: false,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  return adminStatus;
}

