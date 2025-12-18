import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Encrypt a share for storage
 */
export async function encryptShare(text: string, key: string): Promise<string> {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  const combined = encrypted + authTag.toString('hex');

  // Prepend IV for storage
  return iv.toString('hex') + ':' + combined;
}

/**
 * Decrypt a share
 */
export async function decryptShare(encryptedData: string, key: string): Promise<string> {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  const [ivHex, combined] = encryptedData.split(':');
  if (!ivHex || !combined) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const encryptedHex = combined.slice(0, -32);
  const authTagHex = combined.slice(-32);
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}


