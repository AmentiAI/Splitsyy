"use client";

import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/Button";

interface ApplePayButtonProps extends Omit<ButtonProps, "onClick"> {
  onPaymentAuthorized?: (paymentData: any) => void;
  amount?: number;
  currency?: string;
}

export function ApplePayButton({
  onPaymentAuthorized,
  amount,
  currency = "USD",
  ...props
}: ApplePayButtonProps) {
  const [processing, setProcessing] = useState(false);

  const handleClick = async () => {
    // Check if Apple Pay is available
    if (typeof window === "undefined" || !(window as any).ApplePaySession) {
      alert(
        "Apple Pay is not available. Use Safari on an Apple device or Mac with Touch ID."
      );
      return;
    }

    if (!(window as any).ApplePaySession.canMakePayments()) {
      alert("This device is not set up for Apple Pay.");
      return;
    }

    setProcessing(true);

    try {
      // In a real implementation, this would:
      // 1. Create Apple Pay payment request
      // 2. Launch Apple Pay sheet
      // 3. Handle user authorization
      // 4. Process payment token
      // 5. Call onPaymentAuthorized callback

      // For now, show a mock flow
      alert(
        `Apple Pay would launch here!\n\nAmount: ${currency} ${(amount || 0) / 100}\n\nNote: Requires Apple Developer setup and real device.`
      );

      if (onPaymentAuthorized) {
        // Mock payment data
        onPaymentAuthorized({
          mock: true,
          amount: amount,
          currency: currency,
        });
      }
    } catch (error) {
      console.error("Apple Pay error:", error);
      alert("Failed to process Apple Pay payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      loading={processing}
      className="bg-black hover:bg-gray-900 text-white"
      {...props}
    >
      <svg
        className="w-5 h-5 mr-2"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
      {processing ? "Processing..." : "Pay with Apple Pay"}
    </Button>
  );
}














