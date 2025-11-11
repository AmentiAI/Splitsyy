/**
 * Apple Pay Configuration
 *
 * Set APPLE_PAY_ENABLED=false to use mock mode for development.
 */

export const APPLE_PAY_CONFIG = {
  // Enable/disable Apple Pay
  enabled: process.env.APPLE_PAY_ENABLED === "true",

  // Apple Merchant ID (e.g., merchant.com.splitsy)
  merchantId: process.env.APPLE_PAY_MERCHANT_ID || "merchant.com.splitsy.mock",

  // Display name shown in Apple Pay sheet
  merchantName: process.env.APPLE_PAY_MERCHANT_NAME || "Splitsy (Mock)",

  // Domain for Apple Pay
  domain: process.env.NEXT_PUBLIC_APP_URL || "localhost:3000",

  // Apple Developer Team ID
  teamId: process.env.APPLE_PAY_TEAM_ID || "",

  // Certificate paths (for merchant validation)
  certificates: {
    merchantIdentityCert: process.env.APPLE_PAY_MERCHANT_CERT || "",
    merchantIdentityKey: process.env.APPLE_PAY_MERCHANT_KEY || "",
  },

  // Supported networks
  supportedNetworks: ["visa", "mastercard", "amex", "discover"] as const,

  // Merchant capabilities
  merchantCapabilities: ["supports3DS"] as const,

  // Mock mode settings
  mock: {
    // Auto-approve payments in mock mode
    autoApprove: true,

    // Simulate processing delay
    simulateDelay: true,
    delayMs: 1500,

    // Mock payment data
    mockCardDetails: {
      network: "visa",
      last4: "4242",
      displayName: "Visa •••• 4242",
    },
  },
};

export const isApplePayEnabled = () => APPLE_PAY_CONFIG.enabled;

export const isApplePayMockMode = () => !APPLE_PAY_CONFIG.enabled;

export const getApplePayMerchantId = () => APPLE_PAY_CONFIG.merchantId;

export const getApplePayMerchantName = () => APPLE_PAY_CONFIG.merchantName;

/**
 * Check if Apple Pay is available in the browser
 */
export const checkApplePayAvailability = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check if Apple Pay JS API is available
  if (!(window as any).ApplePaySession) {
    console.log("⚠️ Apple Pay not available in this browser");
    return false;
  }

  // Check if device can make payments
  if (!(window as any).ApplePaySession.canMakePayments()) {
    console.log("⚠️ This device cannot make Apple Pay payments");
    return false;
  }

  return true;
};

/**
 * Get Apple Pay button style based on theme
 */
export const getApplePayButtonStyle = (theme: "light" | "dark" = "light") => ({
  "-webkit-appearance": "-apple-pay-button",
  "-apple-pay-button-type": "plain",
  "-apple-pay-button-style": theme === "dark" ? "white-outline" : "black",
});
