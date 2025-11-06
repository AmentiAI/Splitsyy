"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { VirtualCardDisplay } from "@/components/cards/VirtualCardDisplay";
import { formatCurrency, formatDateTime, getStatusVariant } from "@/lib/utils/format";

interface CardDetails {
  card: {
    id: string;
    poolId: string;
    groupName: string;
    currency: string;
    network: string;
    status: string;
    applePayTokenized: boolean;
    balance: number;
    totalContributed: number;
    totalSpent: number;
  };
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    merchantName: string;
    createdAt: string;
  }>;
  userRole: string;
}

function CardDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params?.id as string;

  const [details, setDetails] = useState<CardDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCardDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cards/${cardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load card");
      }

      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cardId) {
      fetchCardDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const handleSuspend = async () => {
    if (!confirm("Are you sure you want to suspend this card?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      await fetchCardDetails();
      alert("Card suspended successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to suspend card");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      await fetchCardDetails();
      alert("Card activated successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to activate card");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToAppleWallet = async () => {
    alert("Apple Pay provisioning would launch here. Integration requires Apple Developer setup.");
    // TODO: Implement Apple Pay provisioning flow
  };

  if (loading) {
    return <LoadingPage text="Loading card details..." />;
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <Alert variant="error" title="Error Loading Card">
              {error || "Card not found"}
            </Alert>
            <Button onClick={() => router.push("/dashboard")} className="mt-4" fullWidth>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { card, transactions, userRole } = details;
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/pools/${card.poolId}`)}
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
              Back to Pool
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Card Display & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Virtual Card */}
            <div>
              <VirtualCardDisplay
                card={{
                  id: card.id,
                  last4: card.last4 || "••••",
                  network: card.network,
                  status: card.status,
                  balance: card.balance,
                  currency: card.currency,
                  groupName: card.groupName,
                }}
              />
            </div>

            {/* Card Stats */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Card Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={getStatusVariant(card.status)}>
                      {card.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Network:</span>
                    <span className="text-sm font-medium capitalize">{card.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Apple Pay:</span>
                    <span className="text-sm font-medium">
                      {card.applePayTokenized ? "✅ Added" : "Not added"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(card.balance, card.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Funded:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(card.totalContributed, card.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Spent:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(card.totalSpent, card.currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Actions */}
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Card Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!card.applePayTokenized && card.status === "active" && (
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleAddToAppleWallet}
                      disabled={actionLoading}
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Add to Apple Wallet
                    </Button>
                  )}

                  {card.status === "active" && isOwnerOrAdmin && (
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleSuspend}
                      loading={actionLoading}
                    >
                      Suspend Card
                    </Button>
                  )}

                  {card.status === "suspended" && isOwnerOrAdmin && (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={handleActivate}
                      loading={actionLoading}
                    >
                      Activate Card
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {txn.merchantName || "Unknown Merchant"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600 capitalize">
                              {txn.type}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">
                              {formatDateTime(txn.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`font-semibold ${txn.type === "purchase" ? "text-red-600" : "text-green-600"}`}>
                            {txn.type === "purchase" ? "-" : "+"}
                            {formatCurrency(txn.amount, txn.currency)}
                          </p>
                          <Badge variant={getStatusVariant(txn.status)} size="sm" className="mt-1">
                            {txn.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No transactions yet
                    </h3>
                    <p className="text-sm text-gray-600">
                      Transactions will appear here once the card is used for purchases.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CardPage() {
  return (
    <AuthGuard>
      <CardDetailsPage />
    </AuthGuard>
  );
}













