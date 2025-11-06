"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const CATEGORIES = [
  { value: "Salary", label: "Salary" },
  { value: "Freelance", label: "Freelance" },
  { value: "Investment", label: "Investment" },
  { value: "Groceries", label: "Groceries" },
  { value: "Food & Dining", label: "Food & Dining" },
  { value: "Transportation", label: "Transportation" },
  { value: "Housing", label: "Housing" },
  { value: "Shopping", label: "Shopping" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Other", label: "Other" },
];

function AddTransactionPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!category) {
      setError("Please select a category");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          type,
          category,
          date,
          account: account || "Main Account",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add transaction");
      }

      setSuccess(true);
      setDescription("");
      setAmount("");
      setCategory("");
      setAccount("");

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Add Transaction</h1>
          <p className="text-gray-600">Record a new transaction manually</p>
        </div>

        <Card className="p-6">
          {success && (
            <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
              Transaction added successfully! Redirecting...
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-4" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Description"
                placeholder="e.g., Grocery Store, Salary Payment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                fullWidth
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />

                <Select
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "income" | "expense")}
                  options={[
                    { value: "income", label: "Income" },
                    { value: "expense", label: "Expense" },
                  ]}
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={CATEGORIES}
                  fullWidth
                  required
                />

                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  fullWidth
                />
              </div>

              <Input
                label="Account (Optional)"
                placeholder="Main Account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                fullWidth
                helperText="Leave blank to use default account"
              />

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!description.trim() || !amount || !category}
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function AddTransaction() {
  return (
    <AuthGuard>
      <AddTransactionPage />
    </AuthGuard>
  );
}

