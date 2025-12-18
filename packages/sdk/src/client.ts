import { createSmartAccountClient, type SmartAccountClient } from 'permissionless';
import { http, type Address, type Hash } from 'viem';
import type { OnkeyConfig, Transaction, VerifyResponse } from './types.js';
import { storeUserShare, getUserShare, clearUserShare } from './storage.js';
/**
 * Onkey SDK Client
 * Main client for interacting with Onkey authentication and smart accounts
 */
export class OnkeyClient {
  private config: OnkeyConfig;
  private token: string | null = null;
  private smartAccountAddress: Address | null = null;
  private smartAccountClient: SmartAccountClient | null = null;

  constructor(config: OnkeyConfig) {
    this.config = config;
    this.loadSession();
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem('onkey_token');
    const storedAddress = localStorage.getItem('onkey_address');

    if (storedToken && storedAddress) {
      this.token = storedToken;
      this.smartAccountAddress = storedAddress as Address;
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSession(token: string, address: Address): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('onkey_token', token);
    localStorage.setItem('onkey_address', address);
    this.token = token;
    this.smartAccountAddress = address;
  }

  /**
   * Clear session
   */
  private clearSession(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('onkey_token');
    localStorage.removeItem('onkey_address');
    this.token = null;
    this.smartAccountAddress = null;
    this.smartAccountClient = null;
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.backendUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send email OTP for login. Returns Stytch `methodId` which must be
   * supplied to `verifyOTP` when confirming the code.
   */
  async login(email: string): Promise<string | undefined> {
    const res = await this.apiRequest<{ success: boolean; message?: string; methodId?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return res.methodId;
  }

  /**
   * Verify OTP code and create session
   */
  async verifyOTP(
    email: string,
    code: string,
    methodId: string
  ): Promise<{ smartAccountAddress: Address; isNewUser: boolean }> {
    const response = await this.apiRequest<VerifyResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code, methodId }),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to verify OTP');
    }

    // Store user share if new user
    if (response.isNewUser && response.userShare) {
      await storeUserShare(response.userShare);
    }

    // Save session
    this.saveSession(response.token, response.smartAccountAddress);

    return {
      smartAccountAddress: response.smartAccountAddress,
      isNewUser: response.isNewUser,
    };
  }

  /**
   * Get or create smart account client
   */
  async getSmartAccount(): Promise<SmartAccountClient> {
    if (this.smartAccountClient) {
      return this.smartAccountClient;
    }

    if (!this.smartAccountAddress) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Get user share
    const userShare = await getUserShare();
    if (!userShare) {
      throw new Error('User key share not found. Please login again.');
    }

    // Create smart account client with custom signer
    // Note: permissionless API changed; bundler/paymaster are provided as transports.
    this.smartAccountClient = createSmartAccountClient({
      account: {
        address: this.smartAccountAddress,
        signMessage: async ({ message }: { message: string | { raw?: string } }) => {
          // Sign via MPC
          const userOpHash = typeof message === 'string' ? message : (message as any).raw;
          const signature = await this.signWithMPC(userOpHash);
          return signature as Hash;
        },
        signTypedData: async () => {
          throw new Error('Typed data signing not yet implemented');
        },
      } as any, // intentional escape hatch: runtime object implements required methods
      chain: this.config.chain,
      bundlerTransport: http(this.config.bundlerUrl),
    });

    return this.smartAccountClient;
  }

  /**
   * Sign a UserOp hash using MPC
   */
  private async signWithMPC(userOpHash: string): Promise<string> {
    const userShare = await getUserShare();
    if (!userShare) {
      throw new Error('User key share not found');
    }

    const response = await this.apiRequest<{ success: boolean; signature: string }>('/mpc/sign', {
      method: 'POST',
      body: JSON.stringify({
        userOpHash,
        userShare,
      }),
    });

    if (!response.success) {
      throw new Error('Failed to sign transaction');
    }

    return response.signature;
  }

  /**
   * Send a transaction (gasless)
   */
  async sendTransaction(tx: Transaction): Promise<{ txHash: Hash }> {
    const smartAccount = await this.getSmartAccount();

    const hash = await (smartAccount as any).sendTransaction({
      to: tx.to,
      value: tx.value || 0n,
      data: tx.data,
    } as any);

    return { txHash: hash };
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    await clearUserShare();
    this.clearSession();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.smartAccountAddress !== null;
  }

  /**
   * Get current smart account address
   */
  getAddress(): Address | null {
    return this.smartAccountAddress;
  }
}

