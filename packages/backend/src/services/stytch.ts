import { logger } from '../utils/logger.js';

const STYTCH_PROJECT_ID = process.env.STYTCH_PROJECT_ID;
const STYTCH_SECRET = process.env.STYTCH_SECRET;

/**
 * Authenticate an email OTP using method_id + code
 * Returns a session_jwt
 */
export async function getStytchAuthToken(
  methodId: string,
  code: string
): Promise<string> {
  if (!methodId || !code) {
    throw new Error('methodId and code are required');
  }

  const authHeader = `Basic ${Buffer.from(
    `${STYTCH_PROJECT_ID}:${STYTCH_SECRET}`
  ).toString('base64')}`;

  const baseUrl = STYTCH_PROJECT_ID?.startsWith('project-test-')
    ? 'https://test.stytch.com'
    : 'https://api.stytch.com';

  const url = `${baseUrl}/v1/otps/authenticate`;

  logger.info({ methodId }, 'Authenticating Stytch OTP');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      method_id: methodId,
      code,
      session_duration_minutes: 60,
    }),
  });

  const data: any = await response.json();

  if (!response.ok) {
    logger.error(
      { status: response.status, data },
      'Stytch OTP authentication failed'
    );
    throw new Error(data.error_message || 'Stytch OTP authentication failed');
  }

  if (!data.session_jwt) {
    throw new Error('No session_jwt returned from Stytch');
  }

  logger.info({ methodId }, 'Stytch OTP authenticated successfully');
  return data.session_jwt;
}

/**
 * Send email OTP and return method_id
 */
export async function createStytchEmailOTP(
  email: string
): Promise<{ method_id: string }> {
  const authHeader = `Basic ${Buffer.from(
    `${STYTCH_PROJECT_ID}:${STYTCH_SECRET}`
  ).toString('base64')}`;

  const baseUrl = STYTCH_PROJECT_ID?.startsWith('project-test-')
    ? 'https://test.stytch.com'
    : 'https://api.stytch.com';

  logger.info({ email }, 'Creating Stytch email OTP');

  // Helper to call the OTP send endpoint
  const sendOtp = async () => {
    const res = await fetch(`${baseUrl}/v1/otps/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        email,
        expiration_minutes: 5,
      }),
    });
    const body = await res.json();
    return { res, body } as { res: Response; body: any };
  };

  let { res: response, body: data } = await sendOtp();

  // If the email isn't found, create the user then retry sending the OTP
  if (!response.ok && data?.error_type === 'email_not_found') {
    logger.info({ email }, 'Stytch email not found; creating user');
    const createRes = await fetch(`${baseUrl}/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ email }),
    });
    const createData: any = await createRes.json();
    if (!createRes.ok) {
      logger.error({ status: createRes.status, createData }, 'Failed to create Stytch user');
      throw new Error(createData.error_message || 'Failed to create Stytch user');
    }

    // retry OTP send
    ({ res: response, body: data } = await sendOtp());
  }

  if (!response.ok) {
    logger.error({ status: response.status, data }, 'Stytch OTP creation failed');
    throw new Error(data.error_message || 'Failed to send OTP');
  }

  const method_id = data.email_id || data.method_id;
  if (!method_id) {
    throw new Error('No method_id returned from Stytch');
  }

  logger.info({ email, method_id }, 'OTP sent');
  return { method_id };
}
