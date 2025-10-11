"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { dollarsToCents } from "@/lib/utils/format";

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId: string;
  currency: string;
}

export function CreatePoolModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  currency,
}: CreatePoolModalProps) {
  const [targetAmount, setTargetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
          groupId,
          targetAmount: dollarsToCents(targetAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create pool");
      }

      // Success
      setTargetAmount("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Pool"
      description="Set a target amount for your group to pool together."
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            label={`Target Amount (${currency})`}
            type="number"
            step="0.01"
            min="0"
            placeholder="100.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
            fullWidth
            leftIcon={
              <span className="text-gray-500 font-medium">{currency === "USD" ? "$" : currency}</span>
            }
            helperText="How much do you want to collect in total?"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 text-sm mb-2">
              💡 How pools work
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Members contribute funds to reach the target</li>
              <li>• Once funded, create a virtual card from the pool</li>
              <li>• Anyone in the group can use the card for purchases</li>
              <li>• All transactions are visible to everyone</li>
            </ul>
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!targetAmount}>
            Create Pool
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}


