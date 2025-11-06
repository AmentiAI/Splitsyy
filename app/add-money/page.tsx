"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { Wallet, Plus, CreditCard } from "lucide-react";

function AddMoneyPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch("/api/wallets");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    }
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/wallets/add-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amountNum * 100), // Convert to cents
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add money");
      }

      setSuccess(true);
      setAmount("");
      
      // Refresh accounts
      const accountsRes = await fetch("/api/wallets");
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData.accounts || []);
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/wallets");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Add Money</h1>
          <p className="text-gray-600">Add funds to your wallet</p>
        </div>

        <Card className="p-6">
          {success && (
            <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
              Money added successfully! Redirecting...
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-4" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(totalBalance / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Amount to Add"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                fullWidth
                leftIcon={<span className="text-gray-500 font-medium">$</span>}
                helperText="Enter the amount you want to add to your wallet"
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
                  disabled={!amount || parseFloat(amount) <= 0}
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Money
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">{account.accountNumber}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    ${(account.balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No payment methods available. Add a payment method first.
              </p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function AddMoney() {
  return (
    <AuthGuard>
      <AddMoneyPage />
    </AuthGuard>
  );
}

