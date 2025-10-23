"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  CreditCard,
  Smartphone,
  Shield
} from "lucide-react";

interface SplitData {
  id: string;
  description: string;
  total_amount: number;
  status: string;
  created_at: string;
  participant: {
    id: string;
    name: string;
    phone: string;
    amount: number;
    status: string;
  };
}

export default function PaymentPage() {
  const params = useParams();
  const [splitData, setSplitData] = useState<SplitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchSplitData = async () => {
      try {
        const response = await fetch(`/api/splits/${params.splitId}/participant/${params.phoneHash}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load split data');
        }

        setSplitData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load split data');
      } finally {
        setLoading(false);
      }
    };

    if (params.splitId && params.phoneHash) {
      fetchSplitData();
    }
  }, [params.splitId, params.phoneHash]);

  const handlePayment = async () => {
    if (!splitData) return;

    setProcessing(true);
    try {
      // TODO: Integrate with actual payment processing
      // This would call your payment provider (Stripe, etc.)
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          splitId: splitData.id,
          participantId: splitData.participant.id,
          amount: splitData.participant.amount,
          paymentMethod
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      // Payment successful
      setSplitData(prev => prev ? {
        ...prev,
        participant: { ...prev.participant, status: 'paid' }
      } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !splitData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="text-red-500 mb-4">
            <Shield className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "This payment link is invalid or has expired."}
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  const isPaid = splitData.participant.status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Splitsy</h1>
          <p className="text-gray-600">Secure payment for shared expenses</p>
        </div>

        {/* Split Details */}
        <Card className="p-6 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {splitData.description}
            </h2>
            <p className="text-sm text-gray-600">
              Created on {new Date(splitData.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Your share:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${splitData.participant.amount.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Total amount:</span>
              <span className="font-semibold text-gray-900">
                ${splitData.total_amount.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Status:</span>
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-semibold">Paid</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-600 font-semibold">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Section */}
        {!isPaid ? (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Choose Payment Method
            </h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Credit/Debit Card</div>
                  <div className="text-sm text-gray-600">Visa, Mastercard, American Express</div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('apple_pay')}
                className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                  paymentMethod === 'apple_pay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-6 h-6 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Apple Pay</div>
                  <div className="text-sm text-gray-600">Pay with Touch ID or Face ID</div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('google_pay')}
                className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                  paymentMethod === 'google_pay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-6 h-6 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Google Pay</div>
                  <div className="text-sm text-gray-600">Quick and secure payment</div>
                </div>
              </button>
            </div>

            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pay ${splitData.participant.amount.toFixed(2)}
                </>
              )}
            </Button>

            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secured by 256-bit SSL encryption</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              Thank you for your payment. The organizer will be notified.
            </p>
            
            {/* Group creation info */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Join a Group!
                  </h4>
                  <p className="text-sm text-blue-800">
                    When everyone pays, we'll automatically create a group so you can all transact together in the future. Create an account to join!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.href = '/auth/register'}
                className="w-full"
              >
                Create Account
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Return to Home
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}




