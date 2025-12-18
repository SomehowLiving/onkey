"use client";

import { useState } from 'react';
import { useOnkey } from '@onkey/sdk';
import { formatAddress } from '../app/utils';

export default function Dashboard({ onLogout }: { onLogout?: () => void }) {
  const { sendTransaction, logout, address, isAuthenticated, isLoading } = useOnkey();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('0.001');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = async () => {
    if (!recipientAddress || !amount) return setError('Enter recipient and amount');
    setError(null);
    try {
      const txResult = await sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: BigInt(Math.floor(parseFloat(amount) * 1e18)),
      });
      const txHash = typeof txResult === 'string' ? txResult : (txResult && (txResult as any).txHash) ?? String(txResult);
      setSuccess(`Transaction sent! Hash: ${txHash}`);
      setRecipientAddress('');
      setAmount('0.001');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <button className="button" onClick={handleLogout} disabled={isLoading}>
          Logout
        </button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3>Your Smart Account</h3>
        <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.5rem' }}>
          {address ? formatAddress(address) : 'Loading...'}
        </p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3>Send Transaction</h3>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {success && <div style={{ color: 'green' }}>{success}</div>}
        <label className="label">Recipient</label>
        <input className="input" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
        <label className="label">Amount (ETH)</label>
        <input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.001" min="0" />
        <button className="button" onClick={handleSend} disabled={isLoading} style={{ marginTop: '0.5rem' }}>
          {isLoading ? 'Sending...' : 'Send Transaction'}
        </button>
      </div>
    </div>
  );
}
