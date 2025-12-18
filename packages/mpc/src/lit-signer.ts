import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { encryptShare, decryptShare } from './encryption.js';
import { logger } from './logger.js';

// Lit Protocol client instance
let litNodeClient: LitNodeClient | null = null;

/**
 * Initialize Lit Protocol client
 */
export async function initLitClient(): Promise<void> {
  if (litNodeClient) {
    return;
  }

  try {
    litNodeClient = new LitNodeClient({
      litNetwork: 'datil-test',
      debug: process.env.NODE_ENV === 'development',
    });

    await litNodeClient.connect();

    logger.info(
      {
        hasClaimKeyId: typeof (litNodeClient as any).claimKeyId === 'function',
        hasPkpSign: typeof (litNodeClient as any).pkpSign === 'function',
      },
      'Lit PKP capabilities'
    );

    logger.info({ network: 'datil-test' }, 'Lit Protocol client initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Lit Protocol client');
    throw new Error('Failed to initialize Lit Protocol client');
  }
}

/**
 * Generate Lit Protocol PKP (Programmable Key Pair)
 * Uses claimKeyId with valid Stytch authentication token
 * Returns PKP information for storage
 */
/**
 * Generate Lit Protocol PKP (Programmable Key Pair)
 * First checks for existing PKPs, then claims new one if needed
 * Returns PKP information for storage
 */
export async function generateMPCKeyShares(
  email?: string,
  stytchToken?: string
): Promise<{
  userShare: string;
  serverShare: string;
  publicKey: string;
  pkpId: string;
  pkpEthAddress: string;
}> {
  await initLitClient();

  if (!litNodeClient) {
    throw new Error('Lit client not initialized');
  }

  if (!email) {
    throw new Error('Email is required for PKP minting');
  }

  if (!stytchToken) {
    throw new Error('Stytch authentication token required for PKP minting');
  }

  const clientAny = litNodeClient as any;

  try {
    /* ============================
     * STAGE 1: Build auth method with valid Stytch token
     * ============================ */
    const authMethod: any = {
      authMethodType: AUTH_METHOD_TYPE.StytchEmailFactorOtp,
      accessToken: stytchToken,
    };

    /* ============================
     * STAGE 1.5: Check for existing PKPs FIRST
     * ============================ */
    let pkpId = '';
    let pkpPublicKey = '';
    
    try {
      logger.info({ email }, 'Checking for existing PKPs');
      
      if (typeof clientAny.fetchPkpsThroughRelayer === 'function') {
        const existingPkps = await clientAny.fetchPkpsThroughRelayer(authMethod);
        
        if (existingPkps && existingPkps.length > 0) {
          logger.info({ 
            email, 
            pkpCount: existingPkps.length,
            firstPkpId: existingPkps[0].tokenId 
          }, 'Found existing PKPs, using first one');
          
          const existingPkp = existingPkps[0];
          pkpId = existingPkp.tokenId || existingPkp.pkpTokenId || '';
          pkpPublicKey = existingPkp.publicKey || existingPkp.pubkey || '';
          
          if (!pkpId || !pkpPublicKey) {
            throw new Error('Existing PKP missing tokenId or publicKey');
          }
          
          // Skip claiming, use existing PKP
          logger.info({ pkpId, email }, 'Using existing PKP');
        }
      } else {
        logger.warn('fetchPkpsThroughRelayer not available, will try claiming');
      }
    } catch (fetchError: any) {
      // If fetch fails, we'll try claiming below
      logger.info({ 
        email, 
        error: fetchError?.message 
      }, 'No existing PKPs found or fetch failed, will claim new one');
    }

    /* ============================
     * STAGE 2: Claim a new PKP via relay (only if no existing PKP found)
     * ============================ */
    if (!pkpId || !pkpPublicKey) {
      if (typeof clientAny.claimKeyId !== 'function') {
        throw new Error('Lit client does not expose claimKeyId method');
      }

      logger.info({ 
        email, 
        authMethodType: AUTH_METHOD_TYPE.StytchEmailFactorOtp 
      }, 'Attempting to claim NEW PKP via relay');

      const claimResponse = await clientAny.claimKeyId({
        authMethod,
        mintCallback: undefined, // defaults to relay
      });

      if (!claimResponse) {
        throw new Error('claimKeyId returned no response');
      }

      logger.debug({ claimResponse }, 'Claim response received');

      /* ============================
       * STAGE 3: Extract PKP ID and public key from claim
       * ============================ */
      pkpId = claimResponse.claimedKeyId || claimResponse.pkpTokenId || claimResponse.derivedKeyId || '';
      pkpPublicKey = claimResponse.pubkey || claimResponse.publicKey || '';

      if (!pkpId || !pkpPublicKey) {
        throw new Error(
          `Failed to extract PKP details from claim response. Got pkpId: ${pkpId}, pubkey: ${pkpPublicKey}`
        );
      }
      
      logger.info({ pkpId, pkpPublicKey }, 'NEW PKP claimed and minted via Lit Protocol');
    }

    /* ============================
     * STAGE 4: Build encrypted shares (same for existing or new PKP)
     * ============================ */
    const userShareData = JSON.stringify({
      type: 'lit-pkp-auth',
      pkpId,
      authMethod,
    });

    const serverShareData = JSON.stringify({
      type: 'lit-pkp-server',
      pkpId,
      pkpPublicKey,
      pkpEthAddress: pkpPublicKey,
    });

    const userEncKey = process.env.USER_ENCRYPTION_KEY;
    const serverEncKey = process.env.SERVER_ENCRYPTION_KEY;

    if (!userEncKey || !serverEncKey) {
      throw new Error('Encryption keys not configured');
    }

    const userShare = await encryptShare(userShareData, userEncKey);
    const serverShare = await encryptShare(serverShareData, serverEncKey);

    return {
      userShare,
      serverShare,
      publicKey: pkpPublicKey,
      pkpId,
      pkpEthAddress: pkpPublicKey,
    };
  } catch (error) {
    logger.error({ error, email }, 'Failed to generate MPC key shares');
    throw error;
  }
}

/**
 * Sign a message hash using Lit Protocol PKP threshold signing
 * Uses pkpSign to perform actual signature via the Lit network
 */
export async function signWithMPC(
  userShare: string,
  serverShare: string,
  messageHash: string
): Promise<string> {
  await initLitClient();

  if (!litNodeClient) {
    throw new Error('Lit client not initialized');
  }

  const clientAny = litNodeClient as any;

  try {
    /* ============================
     * STAGE 1: Decrypt shares
     * ============================ */
    let decryptedUserShare: string;
    let decryptedServerShare: string;

    try {
      decryptedUserShare = await decryptShare(
        userShare,
        process.env.USER_ENCRYPTION_KEY ||
          'default-user-key-change-in-production'
      );
    } catch (err) {
      logger.error({ err }, 'MPC STAGE 1 FAILED: decrypt user share');
      throw new Error('USER_SHARE_DECRYPT_FAILED');
    }

    try {
      decryptedServerShare = await decryptShare(
        serverShare,
        process.env.SERVER_ENCRYPTION_KEY ||
          'default-server-key-change-in-production'
      );
    } catch (err) {
      logger.error({ err }, 'MPC STAGE 1 FAILED: decrypt server share');
      throw new Error('SERVER_SHARE_DECRYPT_FAILED');
    }

    /* ============================
     * STAGE 2: Parse JSON
     * ============================ */
    let userShareData: any;
    let serverShareData: any;

    try {
      userShareData = JSON.parse(decryptedUserShare);
    } catch {
      throw new Error('USER_SHARE_JSON_INVALID');
    }

    try {
      serverShareData = JSON.parse(decryptedServerShare);
    } catch {
      throw new Error('SERVER_SHARE_JSON_INVALID');
    }

    /* ============================
     * STAGE 3: Validate PKP
     * ============================ */
    if (!userShareData.pkpId || !serverShareData.pkpId) {
      throw new Error('PKP_ID_MISSING_IN_SHARES');
    }

    if (userShareData.pkpId !== serverShareData.pkpId) {
      throw new Error('PKP_ID_MISMATCH');
    }

    // Reject mock PKPs
    if (userShareData.type?.includes('mock') || serverShareData.type?.includes('mock')) {
      throw new Error('MOCK_PKP_REFUSED');
    }

    const pkpId = userShareData.pkpId;
    const pkpPublicKey = serverShareData.pkpPublicKey || serverShareData.pkpEthAddress;

    logger.info(
      {
        pkpId,
        hasPkpSign: typeof clientAny.pkpSign === 'function',
      },
      'MPC signing attempt'
    );

    /* ============================
     * STAGE 4: Sign via pkpSign
     * ============================ */
    if (typeof clientAny.pkpSign !== 'function') {
      throw new Error('Lit client does not expose pkpSign method');
    }

    if (!pkpPublicKey) {
      throw new Error('PKP_PUBLIC_KEY_MISSING');
    }

    try {
      const signResult = await clientAny.pkpSign({
        toSign: messageHash,
        pubKey: pkpPublicKey,
        authMethods: [userShareData.authMethod],
      });

      const signature =
        signResult?.signature ||
        signResult?.sig ||
        signResult?.result;

      if (!signature) {
        throw new Error('EMPTY_SIGNATURE_FROM_PKP_SIGN');
      }

      logger.info({ pkpId }, 'MPC SIGN SUCCESS via pkpSign');
      return signature;
    } catch (err) {
      logger.error(
        { err, pkpId },
        'MPC STAGE 4 FAILED: pkpSign'
      );
      throw err;
    }
  } catch (error) {
    logger.error({ error }, 'MPC SIGN FAILED');
    throw error; // 🔥 DO NOT WRAP — preserve cause
  }
}


