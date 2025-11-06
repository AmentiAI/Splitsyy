"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { ArrowUpRight, User, Search } from "lucide-react";

function SendMoneyPage() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [recipient, setRecipient] = useState<any>(null);

  const handleSearch = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setSearching(true);
    setError("");
    setRecipient(null);

    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(recipientEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setRecipient(data.user);
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

    if (!recipient) {
      setError("Please search and select a recipient first");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient.id,
          amount: Math.round(amountNum * 100), // Convert to cents
          note: note.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send money");
      }

      setSuccess(true);
      setAmount("");
      setNote("");
      setRecipient(null);
      setRecipientEmail("");

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Send Money</h1>
          <p className="text-gray-600">Transfer money to another user</p>
        </div>

        <Card className="p-6">
          {success && (
            <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
              Money sent successfully! Redirecting to transactions...
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
                  Recipient Email
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    fullWidth
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearch}
                    loading={searching}
                    disabled={!recipientEmail || !recipientEmail.includes("@")}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {recipient && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{recipient.name || recipient.email}</p>
                      <p className="text-sm text-gray-500">{recipient.email}</p>
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
                helperText="Enter the amount to send"
              />

              <Input
                label="Note (Optional)"
                placeholder="What&apos;s this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                fullWidth
                helperText="Add a note to describe this transaction"
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
                  disabled={!recipient || !amount || parseFloat(amount) <= 0}
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Send Money
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function SendMoney() {
  return (
    <AuthGuard>
      <SendMoneyPage />
    </AuthGuard>
  );
}

