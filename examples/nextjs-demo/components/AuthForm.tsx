"use client";

import { useState } from 'react';
import { useOnkey } from '@onkey/sdk';

export default function AuthForm({ onVerified }: { onVerified?: () => void }) {
  const { login, verifyOTP, isLoading } = useOnkey();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [methodId, setMethodId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email) return setError('Please enter your email');
    setError(null);
    try {
      const returnedMethodId = await login(email);
      setMethodId(returnedMethodId ?? null);
      setSuccess('OTP code sent to your email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  };

  const handleVerify = async () => {
    if (!otpCode || otpCode.length !== 6) return setError('Enter 6-digit code');
    setError(null);
    if (!methodId) return setError('Missing methodId from login; please request OTP again');
    try {
      await verifyOTP(email, otpCode, methodId);
      setSuccess('Verified');
      onVerified?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    }
  };

  return (
    <div className="card">
      <h2>Login with Email</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}

      <label className="label">Email Address</label>
      <input
        type="email"
        className="input"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button className="button" onClick={handleLogin} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send OTP'}
        </button>
        <input
          type="text"
          className="input"
          placeholder="123456"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          style={{ width: '6rem' }}
          disabled={isLoading}
        />
        <button className="button" onClick={handleVerify} disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );
}
