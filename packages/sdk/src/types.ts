import { type Address, type Chain, type Hex } from 'viem';

export interface OnkeyConfig {
  backendUrl: string;
  chain: Chain;
  bundlerUrl: string;
  paymasterUrl: string;
  factoryAddress: Address;
  entryPointAddress: Address;
}

export interface Transaction {
  to: Address;
  value?: bigint;
  data?: Hex;
}

export interface UserInfo {
  email: string;
  smartAccountAddress: Address;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  methodId?: string;
}

export interface VerifyResponse {
  success: boolean;
  token: string;
  smartAccountAddress: Address;
  isNewUser: boolean;
  userShare?: string;
  message?: string;
}

