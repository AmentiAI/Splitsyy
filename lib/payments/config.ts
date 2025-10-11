/**
 * Payment Provider Configuration
 * 
 * This file centralizes payment provider settings.
 * Set PAYMENT_PROVIDER_ENABLED=false to use mock mode for development.
 */

export const PAYMENT_CONFIG = {
  // Set to 'stripe' or 'lithic' when ready
  provider: (process.env.PAYMENT_PROVIDER || "mock") as "stripe" | "lithic" | "mock",
  
  // Enable/disable real payment processing
  enabled: process.env.PAYMENT_PROVIDER_ENABLED === "true",
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },
  
  // Lithic configuration
  lithic: {
    apiKey: process.env.LITHIC_API_KEY || "",
    webhookSecret: process.env.LITHIC_WEBHOOK_SECRET || "",
  },
  
  // Mock mode settings
  mock: {
    // Simulate payment delays
    simulateDelay: true,
    delayMs: 1000,
    
    // Simulate payment failures (percentage)
    failureRate: 0, // 0-100
    
    // Auto-succeed contributions
    autoSucceedContributions: true,
  },
};

export const isPaymentProviderEnabled = () => PAYMENT_CONFIG.enabled;

export const getPaymentProvider = () => PAYMENT_CONFIG.provider;

export const isStripeEnabled = () => 
  PAYMENT_CONFIG.enabled && PAYMENT_CONFIG.provider === "stripe";

export const isLithicEnabled = () => 
  PAYMENT_CONFIG.enabled && PAYMENT_CONFIG.provider === "lithic";

export const isMockMode = () => 
  !PAYMENT_CONFIG.enabled || PAYMENT_CONFIG.provider === "mock";


