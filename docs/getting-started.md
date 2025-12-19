# Getting Started

## Prerequisites

- Node.js 18+ and pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+, Redis 7+

## Quick local setup

1. Clone the repo

```bash
git clone git@github.com:SomehowLiving/onkey.git
cd onkey
pnpm install
```

2. Copy env example

```bash
cp .env.example .env
# Edit .env and fill in required values
```

3. Start services with Docker Compose

```bash
docker-compose up -d
```

4. Run migrations

```bash
cd packages/backend
pnpm db:migrate
```

5. Start dev servers

```bash
# Backend
pnpm --filter ./packages/backend dev
# SDK (if you're iterating on it)
pnpm --filter ./packages/sdk dev
# Demo app
pnpm --filter ./examples/nextjs-demo dev
```

## Environment variables (important)

At minimum fill in the following in `.env` (or `.env.local` in Next apps):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `ENCRYPTION_KEY` - AES key for encrypting key shares (32 bytes hex)
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` - SMTP for sending OTPs
- `BUNDLER_URL` - Bundler RPC (e.g., Pimlico)
- `PAYMASTER_URL` - Paymaster RPC

## Running the demo

Open `examples/nextjs-demo`, configure `NEXT_PUBLIC_BACKEND_URL` and other public env vars, then `pnpm dev`.

---
