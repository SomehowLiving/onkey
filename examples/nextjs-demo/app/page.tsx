"use client";

import { useState } from 'react';
import { OnkeyProvider } from '@onkey/sdk';
import { baseSepolia } from 'viem/chains';
import AuthForm from '../components/AuthForm';
import Dashboard from '../components/Dashboard';

function DemoApp() {
  const [step, setStep] = useState<'login' | 'dashboard'>('login');

  return (
    <main className="container">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Onkey Demo</h1>
      <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
        Self-hosted Web3 authentication SDK - Email login with smart contract wallets
      </p>

      {step === 'login' && <AuthForm onVerified={() => setStep('dashboard')} />}
      {step === 'dashboard' && <Dashboard onLogout={() => setStep('login')} />}
    </main>
  );
}

export default function Home() {
  const onkeyConfig = {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
    chain: baseSepolia,
    bundlerUrl: process.env.NEXT_PUBLIC_BUNDLER_URL || '',
    paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || '',
    factoryAddress: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    entryPointAddress: ('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789') as `0x${string}`,
  } as any;

  return (
    <OnkeyProvider config={onkeyConfig}>
      <DemoApp />
    </OnkeyProvider>
  );
}

