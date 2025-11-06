"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, User, Search } from "lucide-react";

function RequestMoneyPage() {
  const router = useRouter();
  const [requesterEmail, setRequesterEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [requester, setRequester] = useState<any>(null);

  const handleSearch = async () => {
    if (!requesterEmail || !requesterEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setSearching(true);
    setError("");
    setRequester(null);

    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(requesterEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setRequester(data.user);
        } else {
          setError("User not found. Please check the email address.");
        }
      } else {
        setError("Failed to search for user");
      }
    } catch (err) {
      setError("Failed to search for user");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!requester) {
      setError("Please search and select a requester first");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: requester.id,
          amount: Math.round(amountNum * 100), // Convert to cents
          note: note.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request money");
      }

      setSuccess(true);
      setAmount("");
      setNote("");
      setRequester(null);
      setRequesterEmail("");

      setTimeout(() => {
        router.push("/transactions");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Request Money</h1>
          <p className="text-gray-600">Request payment from another user</p>
        </div>

        <Card className="p-6">
          {success && (
            <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
              Money request sent successfully! Redirecting to transactions...
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-4" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requester Email
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    fullWidth
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearch}
                    loading={searching}
                    disabled={!requesterEmail || !requesterEmail.includes("@")}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {requester && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{requester.name || requester.email}</p>
                      <p className="text-sm text-gray-500">{requester.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                fullWidth
                leftIcon={<span className="text-gray-500 font-medium">$</span>}
                helperText="Enter the amount you want to request"
              />

              <Input
                label="Note (Optional)"
                placeholder="What's this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                fullWidth
                helperText="Add a note to describe what this request is for"
              />

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAmount("25")}
                  disabled={loading}
                >
                  $25
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAmount("50")}
                  disabled={loading}
                >
                  $50
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAmount("100")}
                  disabled={loading}
                >
                  $100
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!requester || !amount || parseFloat(amount) <= 0}
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Request Money
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function RequestMoney() {
  return (
    <AuthGuard>
      <RequestMoneyPage />
    </AuthGuard>
  );
}

