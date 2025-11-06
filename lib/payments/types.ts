/**
 * Payment Service Type Definitions
 */

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  clientSecret?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface VirtualCard {
  id: string;
  last4: string;
  brand: "visa" | "mastercard";
  status: "active" | "suspended" | "closed";
  spendingLimit?: number;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  amount: number;
  currency: string;
  merchantName: string;
  status: "pending" | "approved" | "declined";
  createdAt: Date;
}

export interface ApplePayProvisioningData {
  encryptedPassData: string;
  activationData: string;
  ephemeralPublicKey: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  contributionId: string;
  userId: string;
  poolId: string;
  paymentMethod?: string;
}

export interface CreateVirtualCardParams {
  poolId: string;
  userId: string;
  spendingLimit: number;
  currency: string;
}

export interface ProvisionToApplePayParams {
  cardId: string;
  certificates: string[];
  nonce: string;
  nonceSignature: string;
}

export type PaymentProvider = "stripe" | "lithic" | "mock";














