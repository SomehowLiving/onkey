import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
// Note: SALT_LENGTH and TAG_LENGTH were removed as they're not used.

/**
 * Encrypt data using AES-256-GCM
 * @param text - Plaintext to encrypt
 * @param key - Encryption key (32 bytes hex string)
 * @returns Encrypted data with IV and auth tag
 */
export function encrypt(text: string, key: string): { encrypted: string; iv: string } {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine encrypted data with auth tag
  const combined = encrypted + authTag.toString('hex');

  return {
    encrypted: combined,
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Encrypted data with auth tag
 * @param iv - Initialization vector (hex string)
 * @param key - Encryption key (32 bytes hex string)
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string, iv: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  const ivBuffer = Buffer.from(iv, 'hex');

  // Extract auth tag (last 32 hex chars = 16 bytes)
  const encryptedHex = encryptedData.slice(0, -32);
  const authTagHex = encryptedData.slice(-32);
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a random encryption key (32 bytes)
 * @returns Hex string of 64 characters
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}


