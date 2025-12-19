# Onkey Next.js Demo

A small demo app that exercises `@onkey/sdk` login and transaction flows.

## Setup

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_BACKEND_URL` and other public URLs.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and try the Email OTP flow. The demo shows: send OTP → verify → view smart account → send gasless transaction.

> Note: The demo expects the local backend (http://localhost:3001) and MPC service to be running.
