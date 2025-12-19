# Overview

**Onkey** is an open-source, self-hosted, privacy-first authentication SDK that provides Web2-style logins (email, OTP, passkey) while creating smart contract wallets for users under the hood.

## High-level architecture 🔧

- **Frontend SDK** (`@onkey/sdk`) — React-friendly client providing `OnkeyClient`, `OnkeyProvider`, and `useOnkey` hook.
- **Backend API** (`packages/backend`) — Fastify API that handles OTP (Stytch/Stytch-like), user sessions, and MPC orchestration.
- **MPC service** (`packages/mpc`) — Performs threshold signing for user key shares.
- **Smart contracts** (`packages/contracts`) — Factory, account contracts, EntryPoint (ERC-4337) integration.
- **Bundler/Paymaster** — External/third-party relayer (e.g., Pimlico) used for gasless transactions.

> Note: The SDK is intended for browser usage; client-side storage (IndexedDB/localStorage) is used to store encrypted key shares and session tokens.

## Security highlights 🔒

- **Encryption at rest**: Key shares are encrypted AES-256-GCM with an app-managed encryption key.
- **Zero-knowledge-like isolation**: The full private key never exists in cleartext in a single place.
- **Transport security**: HTTPS/TLS required for all production endpoints.
- **Session management**: JWT tokens with short expiry; refresh & revoke on server.
- **Minimal surface area**: SDK is small and only exposes a few public helpers and types.

## Where to start

- Read the Getting Started guide: `docs/getting-started.md`
- SDK usage: `packages/sdk/README.md` and `docs/sdk/getting-started.md`
- API reference: `docs/sdk/api.md`

---
