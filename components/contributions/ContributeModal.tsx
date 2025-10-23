"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { dollarsToCents, formatCurrency } from "@/lib/utils/format";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  poolId: string;
  currency: string;
  remaining: number;
}

const PAYMENT_METHODS = [
  { value: "card", label: "Credit/Debit Card" },
  { value: "ach", label: "Bank Account (ACH)" },
];

export function ContributeModal({
  isOpen,
  onClose,
  onSuccess,
  poolId,
  currency,
  remaining,
}: ContributeModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const amountInCents = dollarsToCents(amountValue);
    if (amountInCents > remaining) {
      setError(`Amount exceeds remaining target (${formatCurrency(remaining, currency)})`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/pools/${poolId}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInCents,
          method,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create contribution");
      }

      // Success
      setAmount("");
      setMethod("card");
      onSuccess();
      onClose();

      // Show success message
      alert(`Contribution of ${formatCurrency(amountInCents, currency)} ${data.payment?.status === "succeeded" ? "processed successfully!" : "initiated! Check your email for payment confirmation."}`);
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
      title="Contribute to Pool"
      description={`Add funds to help reach the target. ${formatCurrency(remaining, currency)} remaining.`}
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
            label={`Amount (${currency})`}
            type="number"
            step="0.01"
            min="0"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            fullWidth
            leftIcon={
              <span className="text-gray-500 font-medium">
                {currency === "USD" ? "$" : currency}
              </span>
            }
            helperText={`Maximum: ${formatCurrency(remaining, currency)}`}
          />

          <Select
            label="Payment Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={PAYMENT_METHODS}
            fullWidth
          />

          {/* Payment Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 text-sm mb-2">
              🔒 Secure Payment
            </h4>
            <p className="text-sm text-gray-600">
              {method === "card"
                ? "You'll be redirected to complete your payment securely."
                : "Bank account details will be requested in the next step."}
            </p>
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
          <Button type="submit" loading={loading} disabled={!amount}>
            {loading ? "Processing..." : `Contribute ${amount ? formatCurrency(dollarsToCents(amount), currency) : ""}`}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}











