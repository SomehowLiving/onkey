import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createSessionToken, createDBSession } from '../services/session.js';
// using Stytch for OTP delivery
import { storePKPInfo } from '../services/keystore.js';
import { getStytchAuthToken, createStytchEmailOTP } from '../services/stytch.js';
import { logger } from '../utils/logger.js';
import { generateMPCKeyShares } from '@onkey/mpc';

const loginSchema = z.object({
  email: z.string().email(),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  methodId: z.string().min(1),
});

// OTP generation handled by Stytch

/**
 * Auth routes
 */
export async function authRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // Rate limiting: 3 OTP requests per email per hour
  fastify.register(import('@fastify/rate-limit'), {
    max: 3,
    timeWindow: '1 hour',
    keyGenerator: (req: FastifyRequest) => {
      const body = req.body as { email?: string };
      return `otp:${body?.email || req.ip}`;
    },
  });

  /**
   * POST /auth/login
   * Send OTP code to email
   */
  const loginBodySchema = {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
    },
    required: ['email'],
  } as const;

  fastify.post(
    '/login',
    {
      schema: {
        body: loginBodySchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof loginSchema> }>, reply: FastifyReply) => {
      const { email } = request.body;

      try {
        // Use Stytch to send OTP and return the method_id to the client
        const { method_id } = await createStytchEmailOTP(email);

        logger.info({ email, method_id }, 'Stytch OTP sent');

        return reply.send({
          success: true,
          message: 'OTP sent via Stytch',
          methodId: method_id,
        } as { success: boolean; message: string; methodId?: string });
      } catch (error) {
        logger.error({ error, email }, 'Failed to send OTP via Stytch');
        return reply.status(500).send({
          success: false,
          message: 'Failed to send OTP',
        });
      }
    }
  );

  /**
   * POST /auth/verify
   * Verify OTP code and create session
   */
  const verifyBodySchema = {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      code: { type: 'string', minLength: 6, maxLength: 6 },
      methodId: { type: 'string' },
    },
    required: ['email', 'code', 'methodId'],
  } as const;

  fastify.post(
    '/verify',
    {
      schema: {
        body: verifyBodySchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof verifySchema> }>, reply: FastifyReply) => {
      const { email, code, methodId } = request.body as any;

      try {
        // Verify OTP with Stytch using methodId returned from /login
        try {
          logger.info({ email, methodId }, 'Authenticating OTP with Stytch');
          const stytchSessionJwt = await getStytchAuthToken(methodId, code);
          // we don't need to store the session_jwt here, but we pass it to PKP minting when needed
          (request as any).stytchSessionJwt = stytchSessionJwt;
        } catch (err) {
          logger.error({ error: err, email, methodId }, 'Stytch OTP authentication failed');
          return reply.status(400).send({ success: false, message: 'Invalid or expired OTP code' });
        }

        // Get or create user
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              emailVerified: true,
            },
          });
        } else if (!user.emailVerified) {
          // Mark email as verified
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
          });
          user.emailVerified = true;
        }

        const isNewUser = !user.smartAccountAddress;

        // If new user, generate MPC key shares
        let userShare: string | undefined;
        if (isNewUser) {
          try {
            // Use the Stytch session JWT obtained earlier during verification
            const stytchToken = (request as any).stytchSessionJwt || (await getStytchAuthToken(methodId, code));
            logger.debug({ email }, 'Stytch auth token available, generating MPC key shares');

            const {
              userShare: generatedUserShare,
              serverShare,
              publicKey,
              pkpId,
              pkpEthAddress,
            } = await generateMPCKeyShares(email, stytchToken);

            // Store server share encrypted
            await storePKPInfo(prisma, user.id, {
              pkpId,
              pkpPublicKey: publicKey,
              pkpEthAddress,
              encryptedServerShare: serverShare,
            });

            // Use PKP address as smart account address for now
            const smartAccountAddress = publicKey;
            
            await prisma.user.update({
              where: { id: user.id },
              data: {
                smartAccountAddress,
              },
            });

            userShare = generatedUserShare;
            user.smartAccountAddress = smartAccountAddress;

            logger.info({ userId: user.id, email }, 'MPC key shares generated for new user');
          } catch (error) {
            logger.error({ 
              error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
              } : String(error),
              userId: user.id 
            }, 'Failed to generate MPC key shares');
            return reply.status(500).send({
              success: false,
              message: 'Failed to generate wallet',
            });
          }
        }

        // Create session token
        const token = await createSessionToken({
          userId: user.id,
          email: user.email,
        });

        // Store session in DB
        await createDBSession(prisma, user.id, token);

        logger.info({ userId: user.id, email, isNewUser }, 'User authenticated');

        const response: {
          success: boolean;
          token: string;
          smartAccountAddress: string;
          isNewUser: boolean;
          userShare?: string;
        } = {
          success: true,
          token,
          smartAccountAddress: user.smartAccountAddress!,
          isNewUser,
        };

        if (isNewUser && userShare) {
          response.userShare = userShare;
        }

        return reply.send(response);
      } catch (error) {
        logger.error({ 
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : String(error),
          email 
        }, 'Failed to verify OTP');
        return reply.status(500).send({
          success: false,
          message: 'Failed to verify OTP',
        });
      }
    }
  );

  /**
   * GET /auth/me
   * Get current user info
   */
  fastify.get(
    '/me',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { userId: string; email: string };

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            email: true,
            smartAccountAddress: true,
          },
        });

        if (!dbUser) {
          return reply.status(404).send({
            success: false,
            message: 'User not found',
          });
        }

        return reply.send({
          success: true,
          email: dbUser.email,
          smartAccountAddress: dbUser.smartAccountAddress,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get user info');
        return reply.status(500).send({
          success: false,
          message: 'Failed to get user info',
        });
      }
    }
  );
}


