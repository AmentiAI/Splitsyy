/**
 * Encryption utilities for sensitive data (SSN, ID numbers)
 * 
 * IMPORTANT: In production, use a proper key management service
 * (AWS KMS, HashiCorp Vault, Azure Key Vault, etc.)
 * 
 * This is a basic implementation using Node.js built-in crypto module
 */

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.SSN_ENCRYPTION_KEY || "default-key-change-in-production-NEVER-USE-IN-PROD";
const ALGORITHM = "aes-256-cbc";

// Derive a consistent key from the encryption key
function getKey(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
}

/**
 * Encrypt sensitive data (SSN, ID numbers)
 */
export function encryptSensitiveData(data: string): string {
  if (!data) return "";
  
  try {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Return IV and encrypted data separated by colon
    return `${iv.toString("hex")}:${encrypted}`;
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
    const parts = encryptedData.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const key = getKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    if (!decrypted) {
      throw new Error("Decryption failed - invalid key or data");
    }
    
    return decrypted;
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


