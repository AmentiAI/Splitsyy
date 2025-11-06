"use client";

import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, Plus, Star } from "lucide-react";
import { dollarsToCents, formatCurrency } from "@/lib/utils/format";
import Link from "next/link";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  poolId: string;
  currency: string;
  remaining: number;
}

interface PaymentMethod {
  id: string;
  type: "card" | "bank_account";
  cardBrand?: string;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  providerPaymentMethodId?: string;
}

const PAYMENT_METHOD_TYPES = [
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
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && method === "card") {
      fetchPaymentMethods();
    }
  }, [isOpen, method]);

  async function fetchPaymentMethods() {
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        const cards = (data.paymentMethods || []).filter((pm: any) => pm.type === "card").map((pm: any) => ({
          id: pm.id,
          type: pm.type,
          cardBrand: pm.card_brand,
          lastFour: pm.last_four,
          expiryMonth: pm.expiry_month,
          expiryYear: pm.expiry_year,
          isDefault: pm.is_default,
          providerPaymentMethodId: pm.provider_payment_method_id,
        }));
        setSavedPaymentMethods(cards);
        // Set default payment method if available
        const defaultMethod = cards.find((pm: PaymentMethod) => pm.isDefault);
        if (defaultMethod?.providerPaymentMethodId) {
          setSelectedPaymentMethodId(defaultMethod.providerPaymentMethodId);
        } else if (cards.length > 0 && cards[0].providerPaymentMethodId) {
          setSelectedPaymentMethodId(cards[0].providerPaymentMethodId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  }

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
          paymentMethodId: method === "card" && selectedPaymentMethodId ? selectedPaymentMethodId : undefined,
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
            label="Payment Type"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setSelectedPaymentMethodId("");
            }}
            options={PAYMENT_METHOD_TYPES}
            fullWidth
          />

          {method === "card" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Card
              </label>
              {loadingPaymentMethods ? (
                <div className="text-sm text-gray-500">Loading cards...</div>
              ) : savedPaymentMethods.length > 0 ? (
                <div className="space-y-2">
                  {savedPaymentMethods.map((pm) => (
                    <label
                      key={pm.id}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethodId === pm.providerPaymentMethodId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.providerPaymentMethodId || ""}
                        checked={selectedPaymentMethodId === pm.providerPaymentMethodId}
                        onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {pm.cardBrand
                                ? `${pm.cardBrand.charAt(0).toUpperCase() + pm.cardBrand.slice(1)} `
                                : ""}
                              {pm.lastFour ? `**** ${pm.lastFour}` : "Card"}
                            </span>
                            {pm.isDefault && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          {pm.expiryMonth && pm.expiryYear && (
                            <p className="text-xs text-gray-500">
                              Expires {pm.expiryMonth.toString().padStart(2, "0")}/{pm.expiryYear}
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                  <Link href="/settings/payment-methods">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Card
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      No saved cards. Add a card to use for contributions.
                    </p>
                    <Link href="/settings/payment-methods">
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 text-sm mb-2">
              🔒 Secure Payment
            </h4>
            <p className="text-sm text-gray-600">
              {method === "card"
                ? savedPaymentMethods.length > 0 && selectedPaymentMethodId
                  ? "Your saved card will be used for this contribution."
                  : "You'll be redirected to complete your payment securely."
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













