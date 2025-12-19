# Onkey Technical Documentation

**For developers integrating Onkey into their applications**

This guide covers everything you need to know to add Onkey authentication to your app, from installation to advanced configuration.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [SDK Reference](#sdk-reference)
5. [Backend API](#backend-api)
6. [Smart Accounts](#smart-accounts)
7. [Security Best Practices](#security-best-practices)
8. [Self-Hosting Guide](#self-hosting-guide)
9. [Advanced Usage](#advanced-usage)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- A deployed Onkey backend (see [Self-Hosting Guide](#self-hosting-guide))
- A Pimlico API key for gasless transactions ([get one here](https://pimlico.io))

### 5-Minute Integration

```bash
# Install the SDK
pnpm add @onkey/sdk viem
```

```tsx
// app/providers.tsx
'use client';

import { OnkeyProvider } from '@onkey/sdk';
import { baseSepolia } from 'viem/chains';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OnkeyProvider
      config={{
        backendUrl: process.env.NEXT_PUBLIC_ONKEY_API_URL!,
        chain: baseSepolia,
        bundlerUrl: process.env.NEXT_PUBLIC_BUNDLER_URL!,
        paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL!,
      }}
    >
      {children}
    </OnkeyProvider>
  );
}
```

```tsx
// app/components/LoginButton.tsx
'use client';

import { useOnkey } from '@onkey/sdk';
import { useState } from 'react';

export function LoginButton() {
  const { login, verifyOTP, address, isAuthenticated } = useOnkey();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');

  const handleEmailSubmit = async () => {
    await login(email);
    setStep('otp');
  };

  const handleOtpSubmit = async () => {
    await verifyOTP(email, otp);
    setStep('done');
  };

  if (isAuthenticated) {
    return (
      <div>
        <p>Connected: {address}</p>
      </div>
    );
  }

  if (step === 'email') {
    return (
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <button onClick={handleEmailSubmit}>Send Code</button>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit code"
        />
        <button onClick={handleOtpSubmit}>Verify</button>
      </div>
    );
  }

  return null;
}
```

```tsx
// app/components/SendButton.tsx
'use client';

import { useOnkey } from '@onkey/sdk';
import { parseEther } from 'viem';

export function SendButton() {
  const { sendTransaction, isAuthenticated } = useOnkey();

  const handleSend = async () => {
    const hash = await sendTransaction({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      value: parseEther('0.01'),
    });
    console.log('Transaction hash:', hash);
  };

  if (!isAuthenticated) return null;

  return <button onClick={handleSend}>Send 0.01 ETH</button>;
}
```

That's it! Users can now login with email and send transactions without holding ETH.

---

## Installation

### Frontend SDK

```bash
pnpm add @onkey/sdk viem
```

**Peer dependencies:**
- `viem` ^2.0.0
- `react` ^18.0.0 (if using React hooks)

### Backend (Self-Hosted)

See [Self-Hosting Guide](#self-hosting-guide) for complete backend setup.

---

## Configuration

### OnkeyProvider Props

```typescript
interface OnkeyConfig {
  // Your self-hosted backend URL
  backendUrl: string;

  // Blockchain configuration
  chain: Chain; // viem Chain object (e.g., baseSepolia, mainnet)

  // ERC-4337 infrastructure
  bundlerUrl: string; // Pimlico bundler endpoint
  paymasterUrl: string; // Pimlico paymaster endpoint

  // Optional: Custom storage for user shares
  storage?: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
  };

  // Optional: Customize session behavior
  session?: {
    expiryHours?: number; // Default: 24
    refreshThreshold?: number; // Refresh when <N hours left, default: 1
  };

  // Optional: UI customization
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
}
```

### Example Configurations

**Production (Mainnet):**

```typescript
import { base } from 'viem/chains';

const config: OnkeyConfig = {
  backendUrl: 'https://auth.yourdomain.com',
  chain: base,
  bundlerUrl: `https://api.pimlico.io/v2/8453/rpc?apikey=${process.env.PIMLICO_KEY}`,
  paymasterUrl: `https://api.pimlico.io/v2/8453/rpc?apikey=${process.env.PIMLICO_KEY}`,
};
```

**Development (Testnet):**

```typescript
import { baseSepolia } from 'viem/chains';

const config: OnkeyConfig = {
  backendUrl: 'http://localhost:3001',
  chain: baseSepolia,
  bundlerUrl: `https://api.pimlico.io/v2/84532/rpc?apikey=${process.env.PIMLICO_KEY}`,
  paymasterUrl: `https://api.pimlico.io/v2/84532/rpc?apikey=${process.env.PIMLICO_KEY}`,
};
```

---

## SDK Reference

### `useOnkey()` Hook

The main React hook for authentication and wallet operations.

```typescript
function useOnkey(): {
  // Authentication
  login: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Wallet operations
  sendTransaction: (tx: Transaction) => Promise<Hash>;
  signMessage: (message: string) => Promise<Hex>;
  
  // Account info
  address: Address | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Advanced
  getSmartAccountClient: () => Promise<SmartAccountClient>;
}
```

### Methods

#### `login(email: string)`

Initiates the email OTP flow. Sends a 6-digit code to the user's email.

```typescript
const { login } = useOnkey();

await login('user@example.com');
// User receives email with OTP code
```

**Throws:**
- `OnkeyError` if email is invalid
- `OnkeyError` if rate limit exceeded (3 per hour per email)

---

#### `verifyOTP(email: string, code: string)`

Verifies the OTP code and completes authentication.

```typescript
const { verifyOTP } = useOnkey();

await verifyOTP('user@example.com', '123456');
// User is now authenticated
// address is now populated
```

**Throws:**
- `OnkeyError` if code is invalid or expired
- `OnkeyError` if rate limit exceeded (5 attempts per code)

**Side effects:**
- Stores session token in localStorage
- Stores encrypted user key share in IndexedDB
- If new user: generates MPC key pair and creates smart account

---

#### `sendTransaction(tx: Transaction)`

Sends a transaction from the user's smart account. Gasless by default (paid by your paymaster).

```typescript
const { sendTransaction } = useOnkey();

// Send ETH
const hash = await sendTransaction({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  value: parseEther('0.1'),
});

// Call contract function
const hash = await sendTransaction({
  to: '0xUSDC_CONTRACT_ADDRESS',
  data: encodeFunctionData({
    abi: USDC_ABI,
    functionName: 'transfer',
    args: ['0xRecipient', parseUnits('100', 6)],
  }),
});

// Batch multiple operations
const hash = await sendTransaction({
  calls: [
    { to: '0xAddress1', value: parseEther('0.1') },
    { to: '0xAddress2', value: parseEther('0.2') },
  ],
});
```

**Returns:** Transaction hash (0x...)

**Throws:**
- `OnkeyError` if not authenticated
- `OnkeyError` if MPC signing fails
- `OnkeyError` if transaction simulation fails

---

#### `signMessage(message: string)`

Signs a message with the user's wallet (for authentication, etc).

```typescript
const { signMessage } = useOnkey();

const signature = await signMessage('Sign this to prove you own this wallet');
```

**Returns:** Hex-encoded signature

---

#### `logout()`

Logs the user out and clears local storage.

```typescript
const { logout } = useOnkey();

await logout();
// User is logged out
// address is now null
// Local key share is deleted
```

---

#### `getSmartAccountClient()`

Advanced: Get the underlying Permissionless.js smart account client for custom operations.

```typescript
const { getSmartAccountClient } = useOnkey();

const client = await getSmartAccountClient();

// Use Permissionless.js methods directly
const userOpHash = await client.sendUserOperation({
  // ... custom UserOperation
});
```

---

### Properties

#### `address: Address | null`

The user's smart account address (ERC-4337). Available immediately after authentication.

```typescript
const { address } = useOnkey();

if (address) {
  console.log('User wallet:', address);
}
```

---

#### `isAuthenticated: boolean`

Whether the user is currently authenticated.

```typescript
const { isAuthenticated } = useOnkey();

if (!isAuthenticated) {
  return <LoginButton />;
}
```

---

#### `isLoading: boolean`

Whether an authentication operation is in progress.

```typescript
const { isLoading, login } = useOnkey();

if (isLoading) {
  return <Spinner />;
}
```

---

## Backend API

### Base URL

All endpoints are relative to your `backendUrl` configuration.

**Example:** `https://auth.yourdomain.com`

---

### Authentication Flow

#### `POST /auth/login`

Initiates email OTP flow.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email"
}
```

**Rate limit:** 3 requests per hour per email

---

#### `POST /auth/verify`

Verifies OTP and creates session.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (existing user):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "smartAccountAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isNewUser": false
}
```

**Response (new user):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "smartAccountAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isNewUser": true,
  "userShare": "encrypted_key_share_data..."
}
```

**Rate limit:** 5 attempts per OTP code

---

#### `GET /auth/me`

Get current user info.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "email": "user@example.com",
  "smartAccountAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### MPC Operations

#### `POST /mpc/sign`

Sign a transaction or message using MPC.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "userOpHash": "0xabcdef...",
  "userShare": "encrypted_user_key_share..."
}
```

**Response:**
```json
{
  "signature": "0x1234567890abcdef..."
}
```

**Security notes:**
- User share is encrypted before being sent
- Server never sees full private key
- Signature is computed via threshold signing
- All shares wiped from memory after signing

---

## Smart Accounts

### What is a Smart Account?

Smart accounts (ERC-4337) are smart contracts that act as wallets. Unlike traditional wallets (EOAs), they have programmable features:

- **Gasless transactions:** App can sponsor gas fees
- **Batch operations:** Multiple actions in one transaction
- **Session keys:** Temporary permissions for specific actions
- **Social recovery:** Recover account via trusted contacts
- **Custom logic:** Spending limits, 2FA, etc.

### Account Creation

Smart accounts are created **deterministically** using CREATE2:

```
address = CREATE2(factory, salt, initCode)
```

**Key properties:**
- Address is known before deployment
- Same inputs = same address (across all chains)
- Account is deployed on first transaction (counterfactual)

### Account Structure

```solidity
OnkeyAccount (inherits Kernel v2)
├── Owner: MPC public key
├── EntryPoint: 0x0000000071727De22E5E9d8BAf0edAc6f37da032
├── Modules:
│   ├── Validator: ECDSA validator (MPC signatures)
│   ├── Executor: Default executor
│   └── Hooks: (Phase 2: recovery, session keys)
```

### Reading Account Info

```typescript
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Get account balance
const balance = await client.getBalance({
  address: '0xYourSmartAccountAddress',
});

// Check if account is deployed
const code = await client.getBytecode({
  address: '0xYourSmartAccountAddress',
});
const isDeployed = code !== undefined && code !== '0x';
```

### Sending from Account

Use the Onkey SDK (handles everything automatically):

```typescript
const { sendTransaction } = useOnkey();

await sendTransaction({
  to: '0xRecipient',
  value: parseEther('0.1'),
});
```

Behind the scenes:
1. SDK creates UserOperation
2. Signs with MPC (backend + user share)
3. Submits to bundler
4. Paymaster sponsors gas
5. Bundler includes in blockchain

---

## Security Best Practices

### For Developers

#### 1. Protect Your Backend

```bash
# Use strong secrets (min 32 characters)
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Never commit secrets to git
echo ".env" >> .gitignore
```

#### 2. Enable HTTPS

```bash
# Use Let's Encrypt for free SSL
sudo certbot --nginx -d auth.yourdomain.com
```

All API traffic must use HTTPS in production.

#### 3. Rate Limiting

Default limits (configured in backend):
- OTP generation: 3 per hour per email
- OTP verification: 5 attempts per code
- Transaction signing: 10 per minute per user

Adjust in `.env`:
```bash
RATE_LIMIT_OTP_PER_HOUR=3
RATE_LIMIT_OTP_ATTEMPTS=5
RATE_LIMIT_SIGN_PER_MINUTE=10
```

#### 4. Database Security

```bash
# Use strong database passwords
DB_PASSWORD=$(openssl rand -hex 32)

# Enable SSL for database connections
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Regular backups
pg_dump onkey > backup_$(date +%F).sql
```

#### 5. Key Rotation

Rotate encryption keys periodically:

```bash
# Generate new key
NEW_KEY=$(openssl rand -hex 32)

# Re-encrypt all key shares with new key
pnpm rotate-keys --old-key=$OLD_KEY --new-key=$NEW_KEY

# Update environment
ENCRYPTION_KEY=$NEW_KEY
```

#### 6. Monitoring

Monitor these metrics:
- Failed login attempts (potential attacks)
- MPC signing failures (infrastructure issues)
- Transaction success rate
- API response times

```typescript
// Add to your backend
import { prometheus } from './monitoring';

prometheus.counter('login_attempts_total');
prometheus.counter('login_failures_total');
prometheus.histogram('mpc_signing_duration_seconds');
```

#### 7. Audit Logs

Log all sensitive operations:

```typescript
logger.info('User login initiated', { 
  email: hashEmail(email), // Hash for privacy
  ip: req.ip,
  timestamp: new Date(),
});

logger.warn('Failed OTP verification', {
  email: hashEmail(email),
  attempts: attemptCount,
  ip: req.ip,
});
```

### For Users

#### 1. Device Security

User key shares are stored in IndexedDB. Users should:
- Use devices with disk encryption
- Keep browsers updated
- Use antivirus software
- Lock devices when not in use

#### 2. Email Security

Since login uses email OTP:
- Use strong email password
- Enable 2FA on email account
- Don't share OTP codes
- Report suspicious emails

#### 3. Recovery Planning

**Phase 1 (current):** Recovery requires backend operator intervention.

**Phase 2:** Social recovery lets users designate trusted contacts to help recover accounts.

---

## Self-Hosting Guide

### Prerequisites

- Linux server (Ubuntu 22.04 recommended)
- Docker & Docker Compose installed
- Domain name pointing to your server
- 2GB RAM minimum, 4GB recommended
- 20GB disk space

### Quick Deploy

```bash
# 1. Clone repository
git clone https://github.com/yourusername/onkey
cd onkey

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 3. Generate secrets
export JWT_SECRET=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(openssl rand -hex 32)
export DB_PASSWORD=$(openssl rand -hex 32)

# Update .env with these values

# 4. Start services
docker-compose up -d

# 5. Run database migrations
docker-compose exec backend pnpm prisma migrate deploy

# 6. Verify services
docker-compose ps  # All should be "Up"

# 7. Check logs
docker-compose logs -f backend
```

### Environment Variables

```bash
# .env

# Database
DATABASE_URL=postgresql://onkey:${DB_PASSWORD}@postgres:5432/onkey

# Redis
REDIS_URL=redis://redis:6379

# Backend API
PORT=3001
NODE_ENV=production
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-32-bytes-hex

# Email (Resend recommended)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
EMAIL_PASS=re_your_api_key
EMAIL_FROM=auth@yourdomain.com

# Blockchain
CHAIN_ID=8453  # Base Mainnet
RPC_URL=https://mainnet.base.org
BUNDLER_URL=https://api.pimlico.io/v2/8453/rpc?apikey=YOUR_KEY
PAYMASTER_URL=https://api.pimlico.io/v2/8453/rpc?apikey=YOUR_KEY

# Lit Protocol
LIT_NETWORK=habanero  # mainnet

# Smart Contracts (deploy first)
FACTORY_ADDRESS=0xYourDeployedFactoryAddress
ENTRYPOINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032
```

### Deploy Smart Contracts

```bash
cd packages/contracts

# Configure deployment
cp .env.example .env
# Add your private key for deployment

# Deploy to testnet first
forge script script/Deploy.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify

# Note the deployed factory address
# Update backend .env with FACTORY_ADDRESS

# Deploy to mainnet (after testing)
forge script script/Deploy.s.sol \
  --rpc-url base \
  --broadcast \
  --verify
```

### SSL Setup (Let's Encrypt)

```bash
# Install Nginx
sudo apt install nginx

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/onkey

# Add this configuration:
server {
    listen 80;
    server_name auth.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/onkey /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d auth.yourdomain.com
```

### Monitoring

```bash
# View logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Monitor resources
docker stats

# Database access
docker-compose exec postgres psql -U onkey -d onkey
```

### Backups

```bash
# Backup database
docker-compose exec postgres pg_dump -U onkey onkey > backup.sql

# Backup .env (encrypted)
tar -czf env-backup.tar.gz .env
openssl enc -aes-256-cbc -salt -in env-backup.tar.gz -out env-backup.tar.gz.enc
```

### Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build

# Run migrations
docker-compose exec backend pnpm prisma migrate deploy

# Restart services
docker-compose restart
```

---

## Advanced Usage

### Custom Storage Adapter

By default, user key shares are stored in browser IndexedDB. You can provide custom storage:

```typescript
import { OnkeyProvider } from '@onkey/sdk';

const customStorage = {
  async get(key: string): Promise<string | null> {
    // Example: Store in React Native AsyncStorage
    return await AsyncStorage.getItem(key);
  },
  
  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

<OnkeyProvider config={{ ...config, storage: customStorage }} />
```

### Session Management

```typescript
// Customize session behavior
<OnkeyProvider
  config={{
    ...config,
    session: {
      expiryHours: 48, // Session lasts 48 hours
      refreshThreshold: 4, // Refresh token when <4 hours remain
    },
  }}
/>
```

### Batch Transactions

```typescript
const { sendTransaction } = useOnkey();

// Send multiple transactions in one UserOperation
await sendTransaction({
  calls: [
    // Approve USDC
    {
      to: USDC_ADDRESS,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SPENDER_ADDRESS, MAX_UINT256],
      }),
    },
    // Swap on Uniswap
    {
      to: UNISWAP_ROUTER,
      data: encodeFunctionData({
        abi: UNISWAP_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [...swapParams],
      }),
    },
  ],
});
```

### Custom Error Handling

```typescript
import { OnkeyError } from '@onkey/sdk';

try {
  await login(email);
} catch (error) {
  if (error instanceof OnkeyError) {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        alert('Too many attempts. Try again in an hour.');
        break;
      case 'INVALID_EMAIL':
        alert('Please enter a valid email address.');
        break;
      case 'NETWORK_ERROR':
        alert('Connection failed. Check your internet.');
        break;
      default:
        alert('An error occurred. Please try again.');
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### "Cannot connect to backend"

**Solution:**
```bash
# Check backend is running
docker-compose ps

# Check logs
docker-compose logs backend

# Verify URL in config
console.log(process.env.NEXT_PUBLIC_ONKEY_API_URL);

# Test endpoint manually
curl https://auth.yourdomain.com/health
```

---

#### "OTP not received"

**Solutions:**

1. Check spam folder
2. Verify email configuration:
```bash
docker-compose exec backend node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({/*your config*/});
transport.verify().then(console.log).catch(console.error);
"
```
3. Check backend logs for email errors
4. Try a different email provider (Resend recommended)

---

#### "MPC signing failed"

**Solutions:**

1. Check Lit Protocol status: https://status.litprotocol.com
2. Verify Redis is running: `docker-compose ps redis`
3. Check MPC service logs: `docker-compose logs mpc`
4. Ensure both key shares are available:
```typescript
// In browser console
console.log(await window.indexedDB.databases());
```

---

#### "Transaction failed"

**Causes & Solutions:**

1. **Insufficient paymaster balance**
   - Check Pimlico dashboard
   - Add funds to paymaster

2. **Invalid transaction parameters**
   - Use `prepareTransaction()` to validate
   - Check contract address is correct

3. **Bundler rejection**
   - Check gas limits
   - Verify account has correct nonce
   - Check bundler logs on Pimlico dashboard

---

#### "Smart account address mismatch"

If predicted address ≠ actual address:

1. Verify factory address in config
2. Check chain ID matches
3. Re-deploy contracts if salt changed
4. Clear browser storage and re-login

---

## Support

**Documentation:** [docs.onkey.dev](https://docs.onkey.dev)  
**GitHub Issues:** [github.com/yourusername/onkey/issues](https://github.com/yourusername/onkey/issues)  
**Discord:** [discord.gg/onkey](https://discord.gg/onkey)  
**Email:** support@onkey.dev

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Areas we need help:**
- Security audits
- Documentation improvements
- Test coverage
- Bug fixes
- Feature implementations

---

**Happy building! 🚀**