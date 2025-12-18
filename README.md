# Onkey - Self-Hosted Web3 Auth SDK

**Onkey** is an open-source, self-hosted, privacy-first authentication SDK that gives users Web2-style logins (email/phone/passkey) with smart contract wallets under the hood.

**Core Value Prop:** "Privy but you own the infrastructure. Privacy-first MPC auth that runs on your own servers."

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd onkey
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)
- `ENCRYPTION_KEY` - Encryption key for key shares (32 bytes hex)
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` - SMTP credentials
- `BUNDLER_URL`, `PAYMASTER_URL` - Pimlico API URLs with keys

4. **Start with Docker Compose**

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis
- Backend API (port 3001)
- MPC service

5. **Run database migrations**

```bash
cd packages/backend
pnpm db:migrate
```

6. **Deploy smart contracts** (optional, for production)

```bash
cd packages/contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url base-sepolia --broadcast --verify
```

## 📦 Project Structure

```
onkey/
├── packages/
│   ├── backend/          # Fastify API server
│   ├── mpc/              # MPC service (Lit Protocol)
│   ├── contracts/        # Smart contracts (Solidity)
│   └── sdk/              # Frontend SDK (@onkey/sdk)
├── examples/
│   └── nextjs-demo/      # Demo Next.js app
└── docker-compose.yml    # Docker setup
```

## 🛠️ Usage

### Frontend SDK

Install the SDK in your React/Next.js app:

```bash
pnpm add @onkey/sdk
```

Wrap your app with `OnkeyProvider`:

```tsx
import { OnkeyProvider } from '@onkey/sdk';
import { baseSepolia } from 'viem/chains';

const config = {
  backendUrl: 'http://localhost:3001',
  chain: baseSepolia,
  bundlerUrl: 'https://api.pimlico.io/v2/84532/rpc?apikey=YOUR_KEY',
  paymasterUrl: 'https://api.pimlico.io/v2/84532/rpc?apikey=YOUR_KEY',
  factoryAddress: '0x...',
  entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
};

function App() {
  return (
    <OnkeyProvider config={config}>
      <YourApp />
    </OnkeyProvider>
  );
}
```

Use the `useOnkey` hook:

```tsx
import { useOnkey } from '@onkey/sdk';

function Login() {
  const { login, verifyOTP, sendTransaction, address, isAuthenticated } = useOnkey();

  const handleLogin = async () => {
    await login('user@example.com');
    // OTP sent to email
  };

  const handleVerify = async (code: string) => {
    await verifyOTP('user@example.com', code);
    // User authenticated, smart account created
  };

  const handleSendTx = async () => {
    await sendTransaction({
      to: '0x...',
      value: BigInt('1000000000000000'), // 0.001 ETH
    });
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Address: {address}</p>
          <button onClick={handleSendTx}>Send Transaction</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## 🔐 Security

- **Encryption at Rest**: All key shares encrypted with AES-256-GCM
- **Encryption in Transit**: HTTPS/TLS required in production
- **Key Share Isolation**: Full private key never exists in memory
- **Session Management**: JWT with 1-hour expiry
- **Rate Limiting**: OTP generation limited to 3 per hour per email

## 🧪 Development

### Backend

```bash
cd packages/backend
pnpm dev
```

### Frontend SDK

```bash
cd packages/sdk
pnpm dev
```

### Demo App

```bash
cd examples/nextjs-demo
pnpm dev
```

### Contracts

```bash
cd packages/contracts
forge build
forge test
```

## 📝 API Endpoints

### POST `/auth/login`

Send OTP code to email.

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
  "message": "OTP code sent to email"
}
```

### POST `/auth/verify`

Verify OTP and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token",
  "smartAccountAddress": "0x...",
  "isNewUser": true,
  "userShare": "encrypted-share"
}
```

### GET `/auth/me`

Get current user info (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "smartAccountAddress": "0x..."
}
```

### POST `/mpc/sign`

Sign a UserOp hash using MPC (requires auth).

**Request:**
```json
{
  "userOpHash": "0x...",
  "userShare": "encrypted-share"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x..."
}
```

## 🎯 MVP Features

✅ Email OTP login  
✅ 2-of-2 MPC key generation  
✅ ERC-4337 smart account creation  
✅ Gasless transactions (Pimlico paymaster)  
✅ Self-hosted Docker setup  
✅ React SDK with hooks  
✅ Next.js demo app  

## 🚧 Roadmap

**Phase 2:**
- Passkeys (WebAuthn)
- Telegram login
- Social recovery
- Session keys

**Phase 3:**
- Multi-chain support
- Mobile SDKs
- Admin dashboard
- Analytics

## 📄 License

MIT License - fully open-source

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

- GitHub Issues for bugs
- Discord for dev support (coming soon)

---

**Built with ❤️ for the Web3 community**

