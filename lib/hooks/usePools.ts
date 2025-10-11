"use client";

import { useState, useEffect } from "react";

export interface Pool {
  id: string;
  groupId: string;
  groupName: string;
  currency: string;
  targetAmount: number;
  status: string;
  designatedPayer?: string;
  createdAt: string;
}

export function usePools(groupId?: string) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = groupId ? `/api/pools?groupId=${groupId}` : "/api/pools";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pools");
      }

      setPools(data.pools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const createPool = async (
    groupId: string,
    targetAmount: number,
    designatedPayer?: string
  ) => {
    try {
      const response = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, targetAmount, designatedPayer }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create pool");
      }

      await fetchPools();
      return data.pool;
    } catch (err) {
      throw err;
    }
  };

  const closePool = async (poolId: string) => {
    try {
      const response = await fetch(`/api/pools/${poolId}/close`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to close pool");
      }

      await fetchPools();
    } catch (err) {
      throw err;
    }
  };

  return {
    pools,
    loading,
    error,
    fetchPools,
    createPool,
    closePool,
  };
}

