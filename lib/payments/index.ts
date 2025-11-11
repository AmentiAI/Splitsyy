/**
 * Payment Service
 *
 * Centralized payment provider abstraction.
 * Automatically uses mock provider when credentials aren't configured.
 */

import { isMockMode, isStripeEnabled, getPaymentProvider } from "./config";
import { mockPaymentProvider } from "./mock-provider";
import { stripePaymentProvider } from "./stripe-provider";
import type {
  PaymentIntent,
  VirtualCard,
  ApplePayProvisioningData,
  CreatePaymentIntentParams,
  CreateVirtualCardParams,
  ProvisionToApplePayParams,
} from "./types";

/**
 * Get the active payment provider
 */
const getProvider = () => {
  if (isMockMode()) {
    console.log("🔷 Using MOCK payment provider");
    return mockPaymentProvider;
  }

  if (isStripeEnabled()) {
    console.log("💳 Using STRIPE payment provider");
    return stripePaymentProvider;
  }

  // Add Lithic support here when needed
  // if (isLithicEnabled()) {
  //   return lithicPaymentProvider;
  // }

  console.log("🔷 Falling back to MOCK payment provider");
  return mockPaymentProvider;
};

/**
 * Payment Service API
 */
export const PaymentService = {
  /**
   * Create a payment intent for a contribution
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntent> {
    const provider = getProvider();
    return provider.createPaymentIntent(params);
  },

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(intentId: string): Promise<PaymentIntent> {
    const provider = getProvider();
    return provider.confirmPaymentIntent(intentId);
  },

  /**
   * Create a virtual card for a pool
   */
  async createVirtualCard(
    params: CreateVirtualCardParams
  ): Promise<VirtualCard> {
    const provider = getProvider();
    return provider.createVirtualCard(params);
  },

  /**
   * Update card status
   */
  async updateCardStatus(
    cardId: string,
    status: "active" | "suspended" | "closed"
  ): Promise<VirtualCard> {
    const provider = getProvider();
    return provider.updateCardStatus(cardId, status);
  },

  /**
   * Provision card to Apple Pay
   */
  async provisionToApplePay(
    params: ProvisionToApplePayParams
  ): Promise<ApplePayProvisioningData> {
    const provider = getProvider();
    return provider.provisionToApplePay(params);
  },

  /**
   * Authorize a transaction
   */
  async authorizeTransaction(
    cardId: string,
    amount: number,
    merchantName: string
  ): Promise<{ approved: boolean; reason?: string }> {
    const provider = getProvider();
    return provider.authorizeTransaction(cardId, amount, merchantName);
  },

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const provider = getProvider();
    return provider.verifyWebhookSignature(payload, signature, secret);
  },

  /**
   * Get payment provider info
   */
  getProviderInfo() {
    return {
      provider: getPaymentProvider(),
      mockMode: isMockMode(),
    };
  },
};

// Export types
export * from "./types";
export * from "./config";
