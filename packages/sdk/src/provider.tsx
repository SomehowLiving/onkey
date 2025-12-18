"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { OnkeyClient } from './client.js';
import type { OnkeyConfig, Transaction } from './types.js';
import { type Address, type Hash } from 'viem';

interface OnkeyContextValue {
  client: OnkeyClient | null;
  login: (email: string) => Promise<string | undefined>;
  verifyOTP: (email: string, code: string, methodId: string) => Promise<void>;
  sendTransaction: (tx: Transaction) => Promise<Hash>;
  logout: () => Promise<void>;
  address: Address | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const OnkeyContext = createContext<OnkeyContextValue | null>(null);

interface OnkeyProviderProps {
  children: ReactNode;
  config: OnkeyConfig;
}

/**
 * OnkeyProvider - React context provider for Onkey SDK
 */
export function OnkeyProvider({ children, config }: OnkeyProviderProps) {
  const [client] = useState(() => new OnkeyClient(config));
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (client.isAuthenticated()) {
      setAddress(client.getAddress());
    }
  }, [client]);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const methodId = await client.login(email);
      return methodId;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (email: string, code: string, methodId: string) => {
    setIsLoading(true);
    try {
      const { smartAccountAddress } = await client.verifyOTP(email, code, methodId);
      setAddress(smartAccountAddress);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransaction = async (tx: Transaction) => {
    setIsLoading(true);
    try {
      const { txHash } = await client.sendTransaction(tx);
      return txHash;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await client.logout();
      setAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: OnkeyContextValue = {
    client,
    login,
    verifyOTP,
    sendTransaction,
    logout,
    address: address || client.getAddress(),
    isAuthenticated: client.isAuthenticated(),
    isLoading,
  };

  return <OnkeyContext.Provider value={value}>{children}</OnkeyContext.Provider>;
}

/**
 * useOnkey - React hook for accessing Onkey SDK
 */
export function useOnkey(): OnkeyContextValue {
  const context = useContext(OnkeyContext);
  if (!context) {
    throw new Error('useOnkey must be used within OnkeyProvider');
  }
  return context;
}

