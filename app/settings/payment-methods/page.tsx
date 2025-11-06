"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
          <div className="text-center py-12">
            <p className="text-gray-600">Loading payment methods...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payment Methods</h1>
          <p className="text-gray-600">Manage your payment cards and bank accounts</p>
        </div>

        {success && (
          <Alert variant="success" className="mb-4" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <div className="mb-6">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods</h3>
                <p className="text-gray-600 mb-6">
                  Add a payment method to use for contributions and payments.
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Payment Method
                </Button>
              </div>
            </Card>
          ) : (
            paymentMethods.map((method) => (
              <Card key={method.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {method.type === "card" ? (
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Building className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {method.type === "card" ? "Card" : "Bank Account"}
                        </h3>
                        {method.is_default && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.type === "card" && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {method.card_brand && `${method.card_brand.charAt(0).toUpperCase() + method.card_brand.slice(1)} `}
                            {method.last_four ? `**** ${method.last_four}` : "****"}
                          </p>
                          {method.expiry_month && method.expiry_year && (
                            <p className="text-xs text-gray-500">
                              Expires {method.expiry_month.toString().padStart(2, "0")}/{method.expiry_year}
                            </p>
                          )}
                        </div>
                      )}
                      {method.billing_name && (
                        <p className="text-sm text-gray-500 mt-1">{method.billing_name}</p>
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
                        <Star className="w-4 h-4 mr-2" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
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

