"use client";

import { useState, useEffect } from "react";

export interface Group {
  id: string;
  name: string;
  currency: string;
  ownerId: string;
  createdAt: string;
  userRole: string;
  userSpendCap?: number;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/groups");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch groups");
      }

      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const createGroup = async (name: string, currency: string = "USD") => {
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      await fetchGroups();
      return data.group;
    } catch (err) {
      throw err;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete group");
      }

      await fetchGroups();
    } catch (err) {
      throw err;
    }
  };

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    deleteGroup,
  };
}

