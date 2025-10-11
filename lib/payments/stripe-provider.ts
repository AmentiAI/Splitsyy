/**
 * Stripe Payment Provider
 * 
 * Real Stripe integration for production use.
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables.
 */

import Stripe from "stripe";
import { PAYMENT_CONFIG } from "./config";
import type {
  PaymentIntent,
  VirtualCard,
  ApplePayProvisioningData,
  CreatePaymentIntentParams,
  CreateVirtualCardParams,
  ProvisionToApplePayParams,
} from "./types";

/**
 * Initialize Stripe client
 */
const getStripeClient = (): Stripe | null => {
  if (!PAYMENT_CONFIG.stripe.secretKey) {
    console.warn("⚠️ Stripe secret key not configured");
    return null;
  }

  return new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
    apiVersion: "2025-09-30.clover",
    typescript: true,
  });
};

/**
 * Stripe Payment Provider Implementation
 */
export class StripePaymentProvider {
  private stripe: Stripe | null;

  constructor() {
    this.stripe = getStripeClient();
  }

  /**
   * Create a payment intent (contribution)
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error("Stripe not configured");
    }

    console.log("💳 [STRIPE] Creating payment intent:", params);

    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: {
        contributionId: params.contributionId,
        userId: params.userId,
        poolId: params.poolId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: this.mapStripeStatus(intent.status),
      clientSecret: intent.client_secret || undefined,
      metadata: intent.metadata,
      createdAt: new Date(intent.created * 1000),
    };
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(intentId: string): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error("Stripe not configured");
    }

    const intent = await this.stripe.paymentIntents.retrieve(intentId);

    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: this.mapStripeStatus(intent.status),
      metadata: intent.metadata,
      createdAt: new Date(intent.created * 1000),
    };
  }

  /**
   * Create a virtual card (Stripe Issuing)
   */
  async createVirtualCard(params: CreateVirtualCardParams): Promise<VirtualCard> {
    if (!this.stripe) {
      throw new Error("Stripe not configured");
    }

    console.log("💳 [STRIPE] Creating virtual card:", params);

    // Create cardholder if needed
    const cardholder = await this.stripe.issuing.cardholders.create({
      name: "Splitsy Pool Card",
      email: "pool@splitsy.com", // You'd get this from the user
      type: "individual",
      billing: {
        address: {
          line1: "123 Main St",
          city: "San Francisco",
          state: "CA",
          postal_code: "94111",
          country: "US",
        },
      },
    });

    // Create the card
    const card = await this.stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: params.currency,
      type: "virtual",
      spending_controls: {
        spending_limits: [
          {
            amount: params.spendingLimit,
            interval: "all_time",
          },
        ],
      },
      metadata: {
        poolId: params.poolId,
        userId: params.userId,
      },
    });

    return {
      id: card.id,
      last4: card.last4,
      brand: card.brand as "visa" | "mastercard",
      status: this.mapCardStatus(card.status),
      spendingLimit: params.spendingLimit,
      metadata: card.metadata,
      createdAt: new Date(card.created * 1000),
    };
  }

  /**
   * Update card status
   */
  async updateCardStatus(
    cardId: string,
    status: "active" | "suspended" | "closed"
  ): Promise<VirtualCard> {
    if (!this.stripe) {
      throw new Error("Stripe not configured");
    }

    const stripeStatus = status === "suspended" ? "inactive" : status;

    const card = await this.stripe.issuing.cards.update(cardId, {
      status: stripeStatus as Stripe.Issuing.Card.Status,
    });

    return {
      id: card.id,
      last4: card.last4,
      brand: card.brand as "visa" | "mastercard",
      status: this.mapCardStatus(card.status),
      metadata: card.metadata,
      createdAt: new Date(card.created * 1000),
    };
  }

  /**
   * Provision card to Apple Pay
   */
  async provisionToApplePay(params: ProvisionToApplePayParams): Promise<ApplePayProvisioningData> {
    if (!this.stripe) {
      throw new Error("Stripe not configured");
    }

    console.log("💳 [STRIPE] Provisioning to Apple Pay:", { cardId: params.cardId });

    // TODO: Implement actual Stripe Apple Pay provisioning
    // This requires Stripe's card delivery API which may vary by Stripe version
    // For now, return placeholder data
    // Reference: https://stripe.com/docs/issuing/cards/digital-wallets
    
    return {
      encryptedPassData: Buffer.from(JSON.stringify({
        stripe: true,
        cardId: params.cardId,
        timestamp: Date.now(),
      })).toString("base64"),
      activationData: `activation_${Date.now()}`,
      ephemeralPublicKey: `ephemeral_${Date.now()}`,
    };
  }

  /**
   * Authorize a card transaction (real-time)
   */
  async authorizeTransaction(
    cardId: string,
    amount: number,
    merchantName: string
  ): Promise<{ approved: boolean; reason?: string }> {
    // In Stripe Issuing, authorization happens via webhooks
    // This method would be called from the webhook handler
    console.log("💳 [STRIPE] Transaction authorization handled via webhook");
    return { approved: true };
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    if (!this.stripe) {
      throw new Error("Stripe not configured");
    }

    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (err) {
      console.error("❌ [STRIPE] Webhook signature verification failed:", err);
      return false;
    }
  }

  /**
   * Map Stripe payment intent status to our status
   */
  private mapStripeStatus(status: string): PaymentIntent["status"] {
    switch (status) {
      case "succeeded":
        return "succeeded";
      case "canceled":
        return "canceled";
      case "processing":
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
        return "pending";
      default:
        return "failed";
    }
  }

  /**
   * Map Stripe card status to our status
   */
  private mapCardStatus(status: string): VirtualCard["status"] {
    switch (status) {
      case "active":
        return "active";
      case "inactive":
        return "suspended";
      case "canceled":
        return "closed";
      default:
        return "suspended";
    }
  }
}

// Export singleton instance
export const stripePaymentProvider = new StripePaymentProvider();

