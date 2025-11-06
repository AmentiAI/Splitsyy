/**
 * Apple Pay Type Definitions
 */

export interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: {
    label: string;
    amount: string;
    type?: "final" | "pending";
  };
  lineItems?: Array<{
    label: string;
    amount: string;
    type?: "final" | "pending";
  }>;
}

export interface ApplePayPaymentToken {
  paymentData: {
    version: string;
    data: string;
    signature: string;
    header: {
      ephemeralPublicKey: string;
      publicKeyHash: string;
      transactionId: string;
    };
  };
  paymentMethod: {
    displayName: string;
    network: string;
    type: string;
  };
  transactionIdentifier: string;
}

export interface ApplePayMerchantValidation {
  merchantIdentifier: string;
  domainName: string;
  displayName: string;
  merchantSessionIdentifier: string;
  nonce: string;
  signature: string;
}

export interface CardProvisioningRequest {
  cardId: string;
  certificates: string[];
  nonce: string;
  nonceSignature: string;
}

export interface CardProvisioningResponse {
  encryptedPassData: string;
  activationData: string;
  ephemeralPublicKey: string;
}

export type ApplePayButtonType = "plain" | "buy" | "donate" | "check-out" | "subscribe" | "add-money" | "contribute";
export type ApplePayButtonStyle = "black" | "white" | "white-outline";














