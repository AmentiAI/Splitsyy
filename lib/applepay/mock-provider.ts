/**
 * Mock Apple Pay Provider
 * 
 * Simulates Apple Pay interactions for development without Apple credentials
 */

import { APPLE_PAY_CONFIG } from "./config";
import type {
  ApplePayPaymentToken,
  ApplePayMerchantValidation,
  CardProvisioningResponse,
} from "./types";

/**
 * Simulate network delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Apple Pay Provider
 */
export class MockApplePayProvider {
  /**
   * Validate merchant session (called by Apple Pay JS API)
   */
  async validateMerchant(validationURL: string): Promise<ApplePayMerchantValidation> {
    console.log("🍎 [MOCK] Validating Apple Pay merchant:", validationURL);

    if (APPLE_PAY_CONFIG.mock.simulateDelay) {
      await delay(APPLE_PAY_CONFIG.mock.delayMs);
    }

    const merchantSession: ApplePayMerchantValidation = {
      merchantIdentifier: APPLE_PAY_CONFIG.merchantId,
      domainName: APPLE_PAY_CONFIG.domain,
      displayName: APPLE_PAY_CONFIG.merchantName,
      merchantSessionIdentifier: `mock_session_${Date.now()}`,
      nonce: Buffer.from(Math.random().toString()).toString("base64"),
      signature: Buffer.from(
        JSON.stringify({
          mock: true,
          timestamp: Date.now(),
        })
      ).toString("base64"),
    };

    console.log("✅ [MOCK] Merchant validation successful");
    return merchantSession;
  }

  /**
   * Process Apple Pay payment token
   */
  async processPaymentToken(token: ApplePayPaymentToken): Promise<{
    success: boolean;
    transactionId: string;
  }> {
    console.log("🍎 [MOCK] Processing Apple Pay payment token");

    if (APPLE_PAY_CONFIG.mock.simulateDelay) {
      await delay(APPLE_PAY_CONFIG.mock.delayMs);
    }

    const success = APPLE_PAY_CONFIG.mock.autoApprove;

    console.log(
      success
        ? "✅ [MOCK] Payment processed successfully"
        : "❌ [MOCK] Payment failed"
    );

    return {
      success,
      transactionId: `mock_txn_${Date.now()}`,
    };
  }

  /**
   * Provision card to Apple Wallet
   */
  async provisionCardToWallet(
    cardId: string,
    certificates: string[],
    nonce: string,
    nonceSignature: string
  ): Promise<CardProvisioningResponse> {
    console.log("🍎 [MOCK] Provisioning card to Apple Wallet:", cardId);

    if (APPLE_PAY_CONFIG.mock.simulateDelay) {
      await delay(APPLE_PAY_CONFIG.mock.delayMs);
    }

    const response: CardProvisioningResponse = {
      encryptedPassData: Buffer.from(
        JSON.stringify({
          mock: true,
          cardId,
          timestamp: Date.now(),
          cardDetails: APPLE_PAY_CONFIG.mock.mockCardDetails,
        })
      ).toString("base64"),
      activationData: Buffer.from(`activation_${Date.now()}`).toString("base64"),
      ephemeralPublicKey: Buffer.from(`ephemeral_key_${Date.now()}`).toString(
        "base64"
      ),
    };

    console.log("✅ [MOCK] Card provisioned to Apple Wallet");
    return response;
  }

  /**
   * Check if card can be added to Apple Wallet
   */
  async canAddCardToWallet(cardId: string): Promise<boolean> {
    console.log("🍎 [MOCK] Checking if card can be added to wallet:", cardId);
    return true; // Always true in mock mode
  }

  /**
   * Simulate Apple Pay availability check
   */
  isApplePayAvailable(): boolean {
    // In mock mode, we simulate that Apple Pay is available
    // but note it's mock mode
    console.log("🍎 [MOCK] Apple Pay availability check - simulating available");
    return true;
  }

  /**
   * Get mock payment method
   */
  getMockPaymentMethod() {
    return {
      displayName: APPLE_PAY_CONFIG.mock.mockCardDetails.displayName,
      network: APPLE_PAY_CONFIG.mock.mockCardDetails.network,
      type: "debit",
    };
  }
}

// Export singleton instance
export const mockApplePayProvider = new MockApplePayProvider();














