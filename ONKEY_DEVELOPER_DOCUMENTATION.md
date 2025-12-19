# Onkey Developer Documentation

Email-based authentication + smart accounts, fully self-hosted.

## Overview

Onkey enables developers to add email-based authentication and account-abstraction smart wallets to their apps using:

- A frontend SDK (`@onkey/sdk`)
- A self-hosted backend (provided as a template)

There is no hosted SaaS — each developer runs their own backend instance.

## Architecture

Frontend (React / Next.js)
  └── `@onkey/sdk`
        └── `OnkeyProvider`
              └── Your Backend (self-hosted)
                    ├── Email OTP
                    ├── Session / JWT
                    ├── Smart Account Creation
                    ├── Key Management (MPC)
                    └── Transaction Relay

## Frontend SDK

### Requirements

- React 18+
- TypeScript (recommended)
- `viem` 2.21.24
- `permissionless`
- Next.js 15 (used in demo, not required)

### Install

```bash
pnpm add @onkey/sdk
```

### Environment variables (example)

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

This must point to your own backend instance.

### Provider Setup

Wrap your application with `OnkeyProvider`:

```tsx
import { OnkeyProvider } from "@onkey/sdk";

export function Providers({ children }) {
  return (
    <OnkeyProvider
      config={{
        backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL!,
      }}
    >
      {children}
    </OnkeyProvider>
  );
}
```

### Hooks API — `useOnkey()`

Main hook for authentication and transactions.

```ts
const {
  login,
  verifyOTP,
  sendTransaction,
  logout,
  address,
  isAuthenticated,
  isLoading,
} = useOnkey();
```

- `login(email: string)` — Initiates email login and sends OTP. Returns `methodId` used for verification.
- `verifyOTP(email, code, methodId)` — Verifies the OTP and authenticates the user.
- `sendTransaction(tx)` — Sends a transaction using the user’s smart account.
- `logout()` — Clears the user session.

Returned state:

- `address` — user’s smart account address
- `isAuthenticated` — auth state
- `isLoading` — loading state

Types used: `OnkeyConfig`, `Transaction`, `UserInfo`.

## Authentication Flow

1. User enters email → `login(email)` → OTP sent to email
2. User enters 6-digit code → `verifyOTP(email, code, methodId)`
3. Smart account created/retrieved and session persisted locally

## Backend (Self-Hosted)

Important: developers run their own backend. Onkey provides the backend code/template — not a hosted service.

### What Onkey provides

- Complete backend codebase
- Authentication logic
- OTP handling
- Smart account creation
- Key management (MPC)
- Transaction relay setup

### Environment variables (examples)

```
# Database
DATABASE_URL=sqlite:./dev.db
# or PostgreSQL for production

# Security
JWT_SECRET=<32+ random characters>
ENCRYPTION_KEY=<32+ random characters>

# Email (OTP delivery)
EMAIL_HOST=smtp.resend.com
EMAIL_USER=resend
EMAIL_PASS=<your API key>
EMAIL_FROM=auth@yourdomain.com

# OTP provider (Stytch)
STYTCH_PROJECT_ID=<from stytch.com>
STYTCH_SECRET=<from stytch.com>

# Blockchain / smart accounts
BUNDLER_URL=https://api.pimlico.io/v2/84532/rpc?apikey=YOUR_KEY
PAYMASTER_URL=https://api.pimlico.io/v2/84532/rpc?apikey=YOUR_KEY

FACTORY_ADDRESS=0x...
ENTRY_POINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032

# Server
PORT=3001
```

### Database setup (Prisma)

The backend ships with a Prisma schema including `User`, `Session`, `OTPCode`.

Run:

```bash
pnpm install
pnpm db:migrate
```

## API Endpoints (summary)

- `POST /auth/login` — body: `{ email }` → Response: `{ methodId, message }`
- `POST /auth/verify` — body: `{ email, code, methodId }` → Response: `{ token, smartAccountAddress, isNewUser }`
- `POST /mpc/sign` — body: `{ userOpHash, userShare }` → Response: `{ signature }`

## Services implemented

- Email service — sends OTP via SMTP
- Stytch — OTP generation & verification
- Session manager — JWT sessions
- MPC — key share generation
- Keystore — encrypted key storage
- AA wallet — smart account creation

## What developers customize vs what Onkey provides

You provide:

- Email provider credentials
- Stytch account
- Blockchain network
- Bundler / Paymaster provider
- Database choice

You don't need to build:

- Authentication logic
- OTP flow
- Session management
- Smart account logic
- Key encryption / MPC

## Running the backend (dev)

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

## Summary

Onkey is a self-hosted authentication + smart account stack. Developers run their own backend, configure env vars, and wrap their frontend with `OnkeyProvider` — that's it.

---

For more detailed docs and API reference see `docs/` and `packages/sdk/README.md`.
