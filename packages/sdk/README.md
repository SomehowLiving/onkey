# @onkey/sdk

Lightweight frontend SDK for Onkey (React/Next.js).

## Install

```bash
pnpm add @onkey/sdk
```

## Quick Start

Wrap your app with `OnkeyProvider` and pass an `OnkeyConfig` object:

```tsx
import { OnkeyProvider } from '@onkey/sdk';
import { baseSepolia } from 'viem/chains';

const config = {
  backendUrl: 'http://localhost:3001',
  chain: baseSepolia,
  bundlerUrl: 'https://api.pimlico.io/v2/xxx/rpc?apikey=KEY',
  paymasterUrl: 'https://api.pimlico.io/v2/xxx/rpc?apikey=KEY',
  factoryAddress: '0x...',
  entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
};

export default function App({ children }: { children: React.ReactNode }) {
  return <OnkeyProvider config={config}>{children}</OnkeyProvider>;
}
```

Use the `useOnkey` hook in your components:

```tsx
import { useOnkey } from '@onkey/sdk';

function Login() {
  const { login, verifyOTP, sendTransaction, address, isAuthenticated } = useOnkey();

  // login('email@domain.com') -> sends OTP and returns methodId
  // verifyOTP(email, code, methodId) -> verifies and creates session
}
```

> Note: The SDK uses IndexedDB to store encrypted key shares and `localStorage` for short-lived tokens — **do not import `storage` helpers on server-side code**.

## API
See `docs/sdk/api.md` for the full API reference and examples.

## TypeScript API docs (TypeDoc)

Generate typed API docs locally:

```bash
# from repo root
pnpm --filter ./packages/sdk docs:typed
# output -> docs/typed
```

A GitHub Actions job also generates TypeDoc on pushes to `main` and uploads the generated HTML as an artifact.

## Publishing & automation

We include a `.releaserc.json` in `packages/sdk` and a workflow that runs `semantic-release` on `main` when you enable automated releases. To enable automatic publishing:

1. Set repository secret `NPM_TOKEN` (npm token) and `SEMANTIC_RELEASE` to `true` when you want automated publishes.
2. Make sure `packages/sdk/package.json` is not `private` (`"private": false`) and has correct `name` and `version`.
3. The workflow will run semantic-release and publish to npm using the `NPM_TOKEN`.

---
