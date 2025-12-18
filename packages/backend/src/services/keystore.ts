import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption.js';
import { logger } from '../utils/logger.js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

/**
 * Store PKP information for a user (replaces old key share storage)
 */
export async function storePKPInfo(
  prisma: PrismaClient,
  userId: string,
  pkpData: {
    pkpId: string;
    pkpPublicKey: string;
    pkpEthAddress: string;
    encryptedServerShare: string;
  }
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      pkpId: pkpData.pkpId,
      pkpPublicKey: pkpData.pkpPublicKey,
      pkpEthAddress: pkpData.pkpEthAddress,
    },
  });

  logger.info({ userId, pkpId: pkpData.pkpId }, 'PKP information stored');
}

/**
 * Get PKP information for a user
 */
export async function getPKPInfo(
  prisma: PrismaClient,
  userId: string
): Promise<{
  pkpId: string;
  pkpPublicKey: string;
  pkpEthAddress: string;
  encryptedServerShare: string;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pkpId: true,
      pkpPublicKey: true,
      pkpEthAddress: true,
      encryptedServerShare: true,
    },
  });

  if (!user || !user.pkpId || !user.pkpPublicKey || !user.pkpEthAddress) {
    return null;
  }

  return {
    pkpId: user.pkpId,
    pkpPublicKey: user.pkpPublicKey,
    pkpEthAddress: user.pkpEthAddress,
    encryptedServerShare: user.encryptedServerShare || '',
  };
}

/**
 * Legacy function - Store encrypted server key share for a user
 * @deprecated Use storePKPInfo instead
 */
export async function storeServerKeyShare(
  prisma: PrismaClient,
  userId: string,
  keyShare: string
): Promise<void> {
  const { encrypted, iv } = encrypt(keyShare, ENCRYPTION_KEY!);

  await prisma.user.update({
    where: { id: userId },
    data: {
      encryptedKeyShare: encrypted,
      keyShareIV: iv,
    },
  });

  logger.info({ userId }, 'Server key share stored (legacy)');
}

/**
 * Legacy function - Retrieve and decrypt server key share for a user
 * @deprecated Use getPKPInfo instead
 */
export async function getServerKeyShare(
  prisma: PrismaClient,
  userId: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      encryptedKeyShare: true,
      keyShareIV: true,
    },
  });

  if (!user || !user.encryptedKeyShare || !user.keyShareIV) {
    throw new Error('Key share not found for user');
  }

  const decrypted = decrypt(user.encryptedKeyShare!, user.keyShareIV!, ENCRYPTION_KEY!);

  return decrypted;
}


