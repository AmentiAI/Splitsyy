"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { PiggyBank } from "lucide-react";
import { dollarsToCents } from "@/lib/utils/format";

function CreateSplitPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch("/api/groups");
        if (response.ok) {
          const data = await response.json();
          const activeGroups = (data.groups || []).filter((g: any) => g.status === "active");
          setGroups(activeGroups);
          if (activeGroups.length > 0) {
            setSelectedGroupId(activeGroups[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        setFetchingGroups(false);
      }
    }
    fetchGroups();
  }, []);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedGroupId) {
      setError("Please select a group");
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          targetAmount: dollarsToCents(targetAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create pool");
      }

      setSuccess(true);
      setTargetAmount("");

      setTimeout(() => {
        router.push(`/groups/${selectedGroupId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingGroups) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading groups...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (groups.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <Card className="p-12">
            <div className="text-center">
              <PiggyBank className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Available</h3>
              <p className="text-gray-600 mb-6">
                You need to create a group first before creating a split (pool).
              </p>
              <Button onClick={() => router.push("/groups/create")}>
                Create Group First
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Split</h1>
          <p className="text-gray-600">Create a pool to collect funds from your group</p>
        </div>

        <Card className="p-6">
          {success && (
            <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
              Split created successfully! Redirecting...
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-4" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Select
                label="Group"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                options={groups.map(g => ({ value: g.id, label: g.name }))}
                fullWidth
                required
                helperText="Select the group for this split"
              />

              {selectedGroup && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Currency: <span className="font-medium">{selectedGroup.currency}</span>
                  </p>
                </div>
              )}

              <Input
                label={`Target Amount (${selectedGroup?.currency || "USD"})`}
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                fullWidth
                leftIcon={
                  <span className="text-gray-500 font-medium">
                    {selectedGroup?.currency === "USD" ? "$" : selectedGroup?.currency || "$"}
                  </span>
                }
                helperText="How much do you want to collect in total?"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 text-sm mb-2 flex items-center">
                  <PiggyBank className="w-4 h-4 mr-2" />
                  How splits work
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Members contribute funds to reach the target</li>
                  <li>• Once funded, create a virtual card from the pool</li>
                  <li>• Anyone in the group can use the card for purchases</li>
                  <li>• All transactions are visible to everyone</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!selectedGroupId || !targetAmount || parseFloat(targetAmount) <= 0}
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <PiggyBank className="w-4 h-4 mr-2" />
                  Create Split
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function CreateSplit() {
  return (
    <AuthGuard>
      <CreateSplitPage />
    </AuthGuard>
  );
}

