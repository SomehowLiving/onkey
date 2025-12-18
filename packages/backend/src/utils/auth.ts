import { FastifyRequest, FastifyReply } from 'fastify';
import { verifySessionToken } from '../services/session.js';

/**
 * Authentication middleware for Fastify
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);
    const payload = await verifySessionToken(token);

    // Attach user to request
    (request as any).user = payload;
  } catch (error) {
    return reply.status(401).send({
      success: false,
      message: 'Invalid or expired session token',
    });
  }
}


