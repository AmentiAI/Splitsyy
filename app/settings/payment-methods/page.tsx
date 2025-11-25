"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AddPaymentMethodModal } from "@/components/payment/AddPaymentMethodModal";
import { CreditCard, Plus, Trash2, Star, Building } from "lucide-react";

interface PaymentMethod {
  id: string;
  type: "card" | "bank_account";
  provider: string;
  card_brand?: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  billing_name?: string;
  is_default: boolean;
  is_active: boolean;
}

function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  async function fetchPaymentMethods() {
    try {
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        setSuccess("Default payment method updated");
        fetchPaymentMethods();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError("Failed to update default payment method");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Payment method removed");
        fetchPaymentMethods();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError("Failed to remove payment method");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getCardBrandIcon = (brand?: string) => {
    switch (brand) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      default:
        return "💳";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="py-12 text-center">
            <p className="text-gray-600">Loading payment methods...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Payment Methods
          </h1>
          <p className="text-gray-600">
            Manage your payment cards and bank accounts
          </p>
        </div>

        {success && (
          <Alert
            variant="success"
            className="mb-4"
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <div className="mb-6">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>

        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <CreditCard className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  No Payment Methods
                </h3>
                <p className="mb-6 text-gray-600">
                  Add a payment method to use for contributions and payments.
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Payment Method
                </Button>
              </div>
            </Card>
          ) : (
            paymentMethods.map((method) => (
              <Card key={method.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      {method.type === "card" ? (
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Building className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {method.type === "card" ? "Card" : "Bank Account"}
                        </h3>
                        {method.is_default && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.type === "card" && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {method.card_brand &&
                              `${method.card_brand.charAt(0).toUpperCase() + method.card_brand.slice(1)} `}
                            {method.last_four
                              ? `**** ${method.last_four}`
                              : "****"}
                          </p>
                          {method.expiry_month && method.expiry_year && (
                            <p className="text-xs text-gray-500">
                              Expires{" "}
                              {method.expiry_month.toString().padStart(2, "0")}/
                              {method.expiry_year}
                            </p>
                          )}
                        </div>
                      )}
                      {method.billing_name && (
                        <p className="mt-1 text-sm text-gray-500">
                          {method.billing_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Add Payment Method Modal */}
        <AddPaymentMethodModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchPaymentMethods();
            setSuccess("Payment method added successfully");
            setTimeout(() => setSuccess(""), 3000);
          }}
          existingPaymentMethodsCount={paymentMethods.length}
        />
      </div>
    </DashboardLayout>
  );
}

export default function PaymentMethods() {
  return (
    <AuthGuard>
      <PaymentMethodsPage />
    </AuthGuard>
  );
}
