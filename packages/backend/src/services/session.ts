import { SignJWT, jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

const secretKey = new TextEncoder().encode(JWT_SECRET);
const JWT_EXPIRY = 60 * 60; // 1 hour in seconds

export interface SessionPayload {
  userId: string;
  email: string;
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const jwtPayload = payload as unknown as Record<string, unknown>;
  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY}s`)
    .sign(secretKey as Uint8Array);

  return jwt;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch (error) {
    logger.warn({ error }, 'Invalid session token');
    throw new Error('Invalid or expired session token');
  }
}

/**
 * Create a database session record
 */
export async function createDBSession(
  prisma: PrismaClient,
  userId: string,
  token: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + JWT_EXPIRY);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(prisma: PrismaClient): Promise<void> {
  const deleted = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  if (deleted.count > 0) {
    logger.info({ count: deleted.count }, 'Cleaned up expired sessions');
  }
}


