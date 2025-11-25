"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { CreditCard, Building } from "lucide-react";

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingPaymentMethodsCount?: number;
}

export function AddPaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  existingPaymentMethodsCount = 0,
}: AddPaymentMethodModalProps) {
  const [type, setType] = useState<"card" | "bank_account">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  // Bank account fields
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // In production, this would use Stripe Elements or similar
      // For now, we'll create a mock payment method
      // Validate required fields
      if (type === "card") {
        if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
          throw new Error("Please enter a valid card number");
        }
        if (!expiryMonth || !expiryYear) {
          throw new Error("Please enter card expiry date");
        }
        if (!cvv || cvv.length < 3) {
          throw new Error("Please enter CVV");
        }
        if (!cardholderName) {
          throw new Error("Please enter cardholder name");
        }
      } else {
        if (!accountNumber || accountNumber.length < 4) {
          throw new Error("Please enter a valid account number");
        }
        if (!routingNumber || routingNumber.length !== 9) {
          throw new Error("Please enter a valid 9-digit routing number");
        }
        if (!accountHolderName) {
          throw new Error("Please enter account holder name");
        }
      }

      const paymentMethodData: any = {
        type,
        provider: "stripe", // or "mock" if Stripe not configured
        isDefault: existingPaymentMethodsCount === 0, // Set as default if first payment method
      };

      if (type === "card") {
        // Extract card brand from number
        const cleanedNumber = cardNumber.replace(/\s/g, "");
        const firstDigit = cleanedNumber[0];
        let cardBrand:
          | "visa"
          | "mastercard"
          | "amex"
          | "discover"
          | "jcb"
          | "diners"
          | "unionpay" = "visa";
        if (firstDigit === "5") cardBrand = "mastercard";
        if (firstDigit === "3") cardBrand = "amex";
        if (firstDigit === "4") cardBrand = "visa";
        if (firstDigit === "6") cardBrand = "discover";

        paymentMethodData.cardBrand = cardBrand;
        paymentMethodData.lastFour = cleanedNumber.slice(-4);
        paymentMethodData.expiryMonth = parseInt(expiryMonth);
        paymentMethodData.expiryYear = parseInt(expiryYear);
        paymentMethodData.billingName = cardholderName;
        paymentMethodData.providerPaymentMethodId = `pm_mock_${Date.now()}`;
      } else {
        paymentMethodData.lastFour = accountNumber.slice(-4);
        paymentMethodData.billingName = accountHolderName;
        paymentMethodData.providerPaymentMethodId = `pm_bank_${Date.now()}`;
        paymentMethodData.metadata = {
          routingNumber: routingNumber.slice(0, 4) + "****",
        };
      }

      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentMethodData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add payment method");
      }

      // Reset form
      setCardNumber("");
      setExpiryMonth("");
      setExpiryYear("");
      setCvv("");
      setCardholderName("");
      setAccountNumber("");
      setRoutingNumber("");
      setAccountHolderName("");

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add payment method"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Payment Method"
      description="Add a new payment method to your account"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Payment Method Type Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Payment Method Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType("card")}
              className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                type === "card"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Card</span>
            </button>
            <button
              type="button"
              onClick={() => setType("bank_account")}
              className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                type === "bank_account"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Building className="h-5 w-5" />
              <span className="font-medium">Bank Account</span>
            </button>
          </div>
        </div>

        {type === "card" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Card Number
              </label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(formatCardNumber(e.target.value))
                }
                maxLength={19}
                required
                leftIcon={<CreditCard className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Month
                </label>
                <Input
                  type="number"
                  placeholder="MM"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  min="1"
                  max="12"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Year
                </label>
                <Input
                  type="number"
                  placeholder="YYYY"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  min={new Date().getFullYear()}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  CVV
                </label>
                <Input
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cardholder Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Account Holder Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Routing Number
              </label>
              <Input
                type="text"
                placeholder="123456789"
                value={routingNumber}
                onChange={(e) =>
                  setRoutingNumber(
                    e.target.value.replace(/\D/g, "").slice(0, 9)
                  )
                }
                maxLength={9}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Account Number
              </label>
              <Input
                type="text"
                placeholder="000123456789"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ""))
                }
                required
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            Add Payment Method
          </Button>
        </div>
      </form>
    </Modal>
  );
}
