/**
 * Encryption utilities for sensitive data (SSN, ID numbers)
 * 
 * IMPORTANT: In production, use a proper key management service
 * (AWS KMS, HashiCorp Vault, Azure Key Vault, etc.)
 * 
 * This is a basic implementation using crypto-js
 * Install: npm install crypto-js @types/crypto-js
 */

import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.SSN_ENCRYPTION_KEY || "default-key-change-in-production";

/**
 * Encrypt sensitive data (SSN, ID numbers)
 */
export function encryptSensitiveData(data: string): string {
  if (!data) return "";
  
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypt sensitive data (admin only)
 */
export function decryptSensitiveData(encryptedData: string): string {
  if (!encryptedData) return "";
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error("Decryption failed - invalid key or data");
    }
    
    return decryptedText;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt sensitive data");
  }
}

/**
 * Mask SSN for display (e.g., ***-**-1234)
 */
export function maskSsn(ssn: string): string {
  if (!ssn || ssn.length < 4) return "***-**-****";
  // Handle both formats: 123456789 or 123-45-6789
  const cleaned = ssn.replace(/-/g, "");
  if (cleaned.length < 9) return "***-**-****";
  return `***-**-${cleaned.slice(-4)}`;
}

/**
 * Mask ID number (e.g., ****1234)
 */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber || idNumber.length < 4) return "****";
  return `****${idNumber.slice(-4)}`;
}


