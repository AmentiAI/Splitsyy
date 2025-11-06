"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { CreditCard, AlertCircle } from "lucide-react";

function CreateCardPage() {
  const router = useRouter();
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [network, setNetwork] = useState<"visa" | "mastercard">("visa");
  const [loading, setLoading] = useState(false);
  const [fetchingPools, setFetchingPools] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchPools() {
      try {
        const response = await fetch("/api/pools?status=open");
        if (response.ok) {
          const data = await response.json();
          const openPools = (data.pools || []).filter((p: any) => p.status === "open");
          
          setPools(openPools);
          if (openPools.length > 0) {
            setSelectedPoolId(openPools[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch pools:", error);
      } finally {
        setFetchingPools(false);
      }
    }
    fetchPools();
  }, []);

  const selectedPool = pools.find(p => p.id === selectedPoolId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedPoolId) {
      setError("Please select a pool");
      return;
    }

    const poolBalance = selectedPool?.balance || selectedPool?.currentAmount || 0;
    if (poolBalance <= 0) {
      setError("Pool must have funds before creating a card. Please contribute to the pool first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId: selectedPoolId,
          network,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create card");
      }

      setSuccess(true);

      setTimeout(() => {
        router.push(`/cards/${data.card.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPools) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading pools...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (pools.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <Card className="p-12">
            <div className="text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pools Available</h3>
              <p className="text-gray-600 mb-6">
                You need to create and fund a pool first before ordering a virtual card.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => router.push("/groups/create")}>
                  Create Group
                </Button>
                <Button variant="outline" onClick={() => router.push("/splits/create")}>
                  Create Split
                </Button>
              </div>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Order Virtual Card</h1>
          <p className="text-gray-600">Create a virtual card from a funded pool</p>
        </div>

        <Card className="p-6">
          {success && (
            <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
              Card created successfully! Redirecting...
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
                label="Pool"
                value={selectedPoolId}
                onChange={(e) => setSelectedPoolId(e.target.value)}
                options={pools.map(p => ({ 
                  value: p.id, 
                  label: `${p.groupName || "Pool"} - $${((p.balance || p.currentAmount || 0) / 100).toFixed(2)} available` 
                }))}
                fullWidth
                required
                helperText="Select a funded pool to create a card from"
              />

              {selectedPool && (
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Pool Balance:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${((selectedPool.balance || selectedPool.currentAmount || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Target Amount:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${((selectedPool.targetAmount || selectedPool.target_amount || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {((selectedPool.balance || selectedPool.currentAmount || 0) <= 0) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Pool needs funding</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          This pool has no funds. Members need to contribute first.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Select
                label="Card Network"
                value={network}
                onChange={(e) => setNetwork(e.target.value as "visa" | "mastercard")}
                options={[
                  { value: "visa", label: "Visa" },
                  { value: "mastercard", label: "Mastercard" },
                ]}
                fullWidth
                helperText="Select the card network"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 text-sm mb-2 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Virtual Card Features
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Spending limit equals pool balance</li>
                  <li>• Use for online and in-store purchases</li>
                  <li>• Add to Apple Pay for mobile payments</li>
                  <li>• All group members can view transactions</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!selectedPoolId || !selectedPool || ((selectedPool.balance || selectedPool.currentAmount || 0) <= 0)}
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Create Virtual Card
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function CreateCard() {
  return (
    <AuthGuard>
      <CreateCardPage />
    </AuthGuard>
  );
}

