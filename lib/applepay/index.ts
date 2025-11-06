/**
 * Apple Pay Service
 * 
 * Centralized Apple Pay integration.
 * Automatically uses mock provider when credentials aren't configured.
 */

import { isApplePayEnabled, isApplePayMockMode, APPLE_PAY_CONFIG } from "./config";
import { mockApplePayProvider } from "./mock-provider";
import type {
  ApplePayPaymentToken,
  ApplePayMerchantValidation,
  CardProvisioningResponse,
} from "./types";

/**
 * Get the active Apple Pay provider
 */
const getProvider = () => {
  if (isApplePayMockMode()) {
    console.log("🍎 Using MOCK Apple Pay provider");
    return mockApplePayProvider;
  }

  // TODO: Add real Apple Pay provider when credentials are configured
  console.log("🍎 Using MOCK Apple Pay provider (real provider not yet implemented)");
  return mockApplePayProvider;
};

/**
 * Apple Pay Service API
 */
export const ApplePayService = {
  /**
   * Validate merchant for Apple Pay session
   */
  async validateMerchant(validationURL: string): Promise<ApplePayMerchantValidation> {
    const provider = getProvider();
    return provider.validateMerchant(validationURL);
  },

  /**
   * Process Apple Pay payment token
   */
  async processPaymentToken(
    token: ApplePayPaymentToken
  ): Promise<{ success: boolean; transactionId: string }> {
    const provider = getProvider();
    return provider.processPaymentToken(token);
  },

  /**
   * Provision card to Apple Wallet
   */
  async provisionCardToWallet(
    cardId: string,
    certificates: string[],
    nonce: string,
    nonceSignature: string
  ): Promise<CardProvisioningResponse> {
    const provider = getProvider();
    return provider.provisionCardToWallet(cardId, certificates, nonce, nonceSignature);
  },

  /**
   * Check if card can be added to Apple Wallet
   */
  async canAddCardToWallet(cardId: string): Promise<boolean> {
    const provider = getProvider();
    return provider.canAddCardToWallet(cardId);
  },

  /**
   * Check if Apple Pay is available
   */
  isApplePayAvailable(): boolean {
    const provider = getProvider();
    return provider.isApplePayAvailable();
  },

  /**
   * Get provider info
   */
  getProviderInfo() {
    return {
      enabled: isApplePayEnabled(),
      mockMode: isApplePayMockMode(),
      merchantId: APPLE_PAY_CONFIG.merchantId,
      merchantName: APPLE_PAY_CONFIG.merchantName,
    };
  },
};

// Export types and config
export * from "./types";
export * from "./config";














