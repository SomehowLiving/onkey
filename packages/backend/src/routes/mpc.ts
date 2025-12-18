import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { getPKPInfo } from '../services/keystore.js';
import { signWithMPC } from '@onkey/mpc';

/**
 * ============================
 * Schemas
 * ============================
 */

const signSchema = z.object({
  userOpHash: z.string(),
  userShare: z.string(),
});

const signBodySchema = {
  type: 'object',
  properties: {
    userOpHash: { type: 'string' },
    userShare: { type: 'string' },
  },
  required: ['userOpHash', 'userShare'],
} as const;

/**
 * ============================
 * MPC Routes
 * ============================
 */

export async function mpcRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  /**
   * POST /mpc/sign
   * Threshold-sign a UserOp hash using Lit MPC
   */
  fastify.post(
    '/sign',
    {
      schema: {
        body: signBodySchema,
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      /* ============================
       * STAGE 0: Validate input
       * ============================ */
      const parsed = signSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          stage: 'validation',
          errors: parsed.error.errors,
        });
      }

      const { userOpHash, userShare } = parsed.data;
      const user = request.user as { userId: string };

      let pkpInfo;
      let signature: string;

      try {
        /* ============================
         * STAGE 1: Load PKP info
         * ============================ */
        try {
          pkpInfo = await getPKPInfo(prisma, user.userId);
          if (!pkpInfo) {
            throw new Error('PKP record not found');
          }
        } catch (err) {
          fastify.log.error({ err }, 'MPC STAGE 1 FAILED: PKP lookup');
          throw {
            stage: 'pkp_lookup',
            message: 'Failed to load PKP info',
            cause: err,
          };
        }

        /* ============================
         * STAGE 2: Reject mock PKP
         * ============================ */
        if (pkpInfo.pkpId.startsWith('mock-')) {
          throw {
            stage: 'pkp_validation',
            message: 'Mock PKP detected — real MPC required',
          };
        }

        /* ============================
         * STAGE 3: Validate server share
         * ============================ */
        if (!pkpInfo.encryptedServerShare) {
          throw {
            stage: 'server_share',
            message: 'Missing encrypted server share — MPC not initialized',
          };
        }

        /* ============================
         * STAGE 4: MPC signing
         * ============================ */
        try {
          signature = await signWithMPC(
            userShare,
            pkpInfo.encryptedServerShare,
            userOpHash
          );
        } catch (err) {
          fastify.log.error({ err }, 'MPC STAGE 4 FAILED: signWithMPC');
          throw {
            stage: 'mpc_signing',
            message: 'Lit MPC signing failed',
            cause: err,
          };
        }

        /* ============================
         * SUCCESS
         * ============================ */
        return reply.send({
          success: true,
          signature,
        });
      } catch (err: any) {
        /* ============================
         * FINAL ERROR SURFACE
         * ============================ */
        fastify.log.error(
          {
            stage: err.stage || 'unknown',
            message: err.message,
            cause: err.cause,
          },
          'MPC SIGNING FAILED'
        );

        return reply.status(500).send({
          success: false,
          stage: err.stage || 'unknown',
          message: err.message || 'MPC signing failed',
        });
      }
    }
  );
}
