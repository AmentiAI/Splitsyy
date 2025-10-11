"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { VirtualCardDisplay } from "@/components/cards/VirtualCardDisplay";
import { ContributionsList } from "@/components/contributions/ContributionsList";
import { ContributeModal } from "@/components/contributions/ContributeModal";
import { formatCurrency, formatDate, getStatusVariant } from "@/lib/utils/format";

interface PoolDetails {
  pool: {
    id: string;
    groupId: string;
    groupName: string;
    currency: string;
    targetAmount: number;
    totalContributed: number;
    remaining: number;
    status: string;
    createdAt: string;
  };
  contributions: any[];
  card: any;
  userRole: string;
}

function PoolDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params?.id as string;

  const [details, setDetails] = useState<PoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [creatingCardLoading, setCreatingCardLoading] = useState(false);

  const fetchPoolDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pools/${poolId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load pool");
      }

      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pool");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poolId) {
      fetchPoolDetails();
    }
  }, [poolId]);

  const handleCreateCard = async () => {
    if (!details) return;

    setCreatingCardLoading(true);
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId: details.pool.id,
          network: "visa",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create card");
      }

      // Refresh pool details
      await fetchPoolDetails();
      alert("Virtual card created successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setCreatingCardLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage text="Loading pool details..." />;
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <Alert variant="error" title="Error Loading Pool">
              {error || "Pool not found"}
            </Alert>
            <Button onClick={() => router.push("/dashboard")} className="mt-4" fullWidth>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { pool, contributions, card, userRole } = details;
  const percentage = (pool.totalContributed / pool.targetAmount) * 100;
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";
  const canContribute = pool.status === "open" && pool.remaining > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/groups/${pool.groupId}`)}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Group
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pool Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{pool.groupName} Pool</h1>
              <p className="mt-2 text-gray-600">
                Created {formatDate(pool.createdAt)}
              </p>
            </div>
            <Badge variant={getStatusVariant(pool.status)}>
              {pool.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pool Info & Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pool Stats */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Pool Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(pool.targetAmount, pool.currency)}
                    </p>
                  </div>

                  <ProgressBar
                    value={pool.totalContributed}
                    max={pool.targetAmount}
                    showPercentage
                    label="Progress"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Contributed</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(pool.totalContributed, pool.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Remaining</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatCurrency(pool.remaining, pool.currency)}
                      </p>
                    </div>
                  </div>

                  {canContribute && (
                    <Button
                      onClick={() => setIsContributeOpen(true)}
                      fullWidth
                      size="lg"
                    >
                      Contribute Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Virtual Card */}
            {card ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Virtual Card
                </h3>
                <VirtualCardDisplay
                  card={{
                    id: card.id,
                    last4: "4242", // Would come from provider
                    network: card.network,
                    status: card.status,
                    balance: pool.totalContributed,
                    currency: pool.currency,
                    groupName: pool.groupName,
                  }}
                  onClick={() => router.push(`/cards/${card.id}`)}
                />
              </div>
            ) : (
              pool.totalContributed > 0 &&
              isOwnerOrAdmin && (
                <Card variant="bordered">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="mb-4">
                        <svg
                          className="w-12 h-12 mx-auto text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Create Virtual Card
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Pool has funds. Create a shared card for group purchases.
                      </p>
                      <Button
                        onClick={handleCreateCard}
                        loading={creatingCardLoading}
                        fullWidth
                      >
                        Create Card
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Right Column - Contributions */}
          <div className="lg:col-span-2">
            <ContributionsList
              contributions={contributions}
              currency={pool.currency}
            />
          </div>
        </div>
      </main>

      {/* Contribute Modal */}
      <ContributeModal
        isOpen={isContributeOpen}
        onClose={() => setIsContributeOpen(false)}
        onSuccess={fetchPoolDetails}
        poolId={poolId}
        currency={pool.currency}
        remaining={pool.remaining}
      />
    </div>
  );
}

export default function PoolPage() {
  return (
    <AuthGuard>
      <PoolDetailsPage />
    </AuthGuard>
  );
}

