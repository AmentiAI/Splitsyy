/**
 * Mock Payment Provider
 *
 * Simulates payment processing for development without real credentials.
 * Replace with real Stripe/Lithic implementation when ready.
 */

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
 * Simulate network delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate mock ID
 */
const generateId = (prefix: string) =>
  `${prefix}_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Simulate payment failure based on config
 */
const shouldSimulateFailure = (): boolean => {
  const rate = PAYMENT_CONFIG.mock.failureRate;
  return Math.random() * 100 < rate;
};

/**
 * Mock Payment Provider Implementation
 */
export class MockPaymentProvider {
  /**
   * Create a payment intent (contribution)
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntent> {
    console.log("🔷 [MOCK] Creating payment intent:", params);

    if (PAYMENT_CONFIG.mock.simulateDelay) {
      await delay(PAYMENT_CONFIG.mock.delayMs);
    }

    const failed = shouldSimulateFailure();

    const intent: PaymentIntent = {
      id: generateId("pi"),
      amount: params.amount,
      currency: params.currency,
      status: failed
        ? "failed"
        : PAYMENT_CONFIG.mock.autoSucceedContributions
          ? "succeeded"
          : "pending",
      clientSecret: generateId("pi_secret"),
      metadata: {
        contributionId: params.contributionId,
        userId: params.userId,
        poolId: params.poolId,
      },
      createdAt: new Date(),
    };

    console.log("✅ [MOCK] Payment intent created:", intent);
    return intent;
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(intentId: string): Promise<PaymentIntent> {
    console.log("🔷 [MOCK] Confirming payment intent:", intentId);

    if (PAYMENT_CONFIG.mock.simulateDelay) {
      await delay(PAYMENT_CONFIG.mock.delayMs);
    }

    const failed = shouldSimulateFailure();

    return {
      id: intentId,
      amount: 0, // Would be fetched from DB
      currency: "usd",
      status: failed ? "failed" : "succeeded",
      createdAt: new Date(),
    };
  }

  /**
   * Create a virtual card
   */
  async createVirtualCard(
    params: CreateVirtualCardParams
  ): Promise<VirtualCard> {
    console.log("🔷 [MOCK] Creating virtual card:", params);

    if (PAYMENT_CONFIG.mock.simulateDelay) {
      await delay(PAYMENT_CONFIG.mock.delayMs);
    }

    const card: VirtualCard = {
      id: generateId("card"),
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      brand: "visa",
      status: "active",
      spendingLimit: params.spendingLimit,
      metadata: {
        poolId: params.poolId,
        userId: params.userId,
      },
      createdAt: new Date(),
    };

    console.log("✅ [MOCK] Virtual card created:", card);
    return card;
  }

  /**
   * Update card status
   */
  async updateCardStatus(
    cardId: string,
    status: "active" | "suspended" | "closed"
  ): Promise<VirtualCard> {
    console.log("🔷 [MOCK] Updating card status:", { cardId, status });

    if (PAYMENT_CONFIG.mock.simulateDelay) {
      await delay(500);
    }

    return {
      id: cardId,
      last4: "0000",
      brand: "visa",
      status,
      createdAt: new Date(),
    };
  }

  /**
   * Provision card to Apple Pay
   */
  async provisionToApplePay(
    params: ProvisionToApplePayParams
  ): Promise<ApplePayProvisioningData> {
    console.log("🔷 [MOCK] Provisioning to Apple Pay:", {
      cardId: params.cardId,
    });

    if (PAYMENT_CONFIG.mock.simulateDelay) {
      await delay(PAYMENT_CONFIG.mock.delayMs);
    }

    const data: ApplePayProvisioningData = {
      encryptedPassData: Buffer.from(
        JSON.stringify({
          mock: true,
          cardId: params.cardId,
          timestamp: Date.now(),
        })
      ).toString("base64"),
      activationData: generateId("activation"),
      ephemeralPublicKey: generateId("ephemeral_key"),
    };

    console.log("✅ [MOCK] Apple Pay provisioning data generated");
    return data;
  }

  /**
   * Authorize a card transaction (real-time)
   */
  async authorizeTransaction(
    cardId: string,
    amount: number,
    merchantName: string
  ): Promise<{ approved: boolean; reason?: string }> {
    console.log("🔷 [MOCK] Authorizing transaction:", {
      cardId,
      amount,
      merchantName,
    });

    if (PAYMENT_CONFIG.mock.simulateDelay) {
      await delay(500);
    }

    // Mock approval logic - always approve for now
    const approved = !shouldSimulateFailure();

    console.log(
      approved
        ? "✅ [MOCK] Transaction approved"
        : "❌ [MOCK] Transaction declined"
    );

    return {
      approved,
      reason: approved ? undefined : "Insufficient funds (mock)",
    };
  }

  /**
   * Get card balance
   */
  async getCardBalance(cardId: string): Promise<number> {
    console.log("🔷 [MOCK] Getting card balance:", cardId);
    // In real implementation, would query provider
    return 0;
  }

  /**
   * Verify webhook signature (mock - always returns true)
   */
  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    console.log(
      "🔷 [MOCK] Verifying webhook signature (always returns true in mock mode)"
    );
    return true;
  }
}

// Export singleton instance
export const mockPaymentProvider = new MockPaymentProvider();
