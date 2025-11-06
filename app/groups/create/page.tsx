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
import { Users } from "lucide-react";

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      setSuccess(true);
      setName("");
      setCurrency("USD");

      // The API returns { group: { id, ... } }
      const groupId = data.group?.id || data.id;
      
      if (groupId) {
        setTimeout(() => {
          router.push(`/groups/${groupId}`);
        }, 2000);
      } else {
        // If no group ID, redirect to groups page
        setTimeout(() => {
          router.push("/groups");
        }, 2000);
      }
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Group</h1>
          <p className="text-gray-600">Create a group to start pooling funds and sharing expenses</p>
        </div>

        <Card className="p-6">
          {success && (
            <Alert variant="success" className="mb-4" onClose={() => setSuccess(false)}>
              Group created successfully! Redirecting...
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
                label="Group Name"
                placeholder="Weekend Trip, Roommates, Team Lunch..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                helperText="Choose a descriptive name for your group"
              />

              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={CURRENCIES}
                fullWidth
                helperText="All pools in this group will use this currency"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 text-sm mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  How groups work
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Create pools within the group to collect funds</li>
                  <li>• Add members and set spending limits</li>
                  <li>• Generate virtual cards from funded pools</li>
                  <li>• Track all expenses together</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!name.trim()}
                  fullWidth
                  className="flex items-center justify-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function CreateGroup() {
  return (
    <AuthGuard>
      <CreateGroupPage />
    </AuthGuard>
  );
}

