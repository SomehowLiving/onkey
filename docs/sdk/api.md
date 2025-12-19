# SDK API Reference

This document covers the public surface of `@onkey/sdk`.

## Exports
- `OnkeyClient` — core programmatic client
- `OnkeyProvider` — React context provider
- `useOnkey` — React hook
- Storage helpers: `storeUserShare`, `getUserShare`, `clearUserShare` (browser-only)
- Types: `OnkeyConfig`, `Transaction`, `UserInfo`, `VerifyResponse`, etc.

---

## OnkeyClient

```ts
new OnkeyClient(config: OnkeyConfig)
```

### Methods

- `login(email: string): Promise<string | undefined>`
  - Sends OTP to `email`. Returns `methodId` used for verification.

- `verifyOTP(email: string, code: string, methodId: string): Promise<{ smartAccountAddress: Address; isNewUser: boolean }>`
  - Verifies OTP. On success returns the smart account address and whether the user is new. If `isNewUser` is `true` a `userShare` (encrypted key share) is stored in IndexedDB.

- `getSmartAccount(): Promise<SmartAccountClient>`
  - Returns a `SmartAccountClient` instance (from `permissionless`) configured with a signer that uses MPC signing via the backend.

- `sendTransaction(tx: Transaction): Promise<{ txHash: Hash }>`
  - Sends a gasless transaction via the smart account.

- `logout(): Promise<void>`
  - Clears session token and user key share.

- `isAuthenticated(): boolean`
  - Returns whether a session token and smart account address are present.

- `getAddress(): Address | null`
  - Returns the current smart account address or `null`.

---

## OnkeyProvider & useOnkey

`OnkeyProvider` props:
- `config: OnkeyConfig` — same structure used by `OnkeyClient`
- `children` — React children

`useOnkey()` returns:
```ts
{
  client: OnkeyClient | null,
  login: (email: string) => Promise<string | undefined>,
  verifyOTP: (email: string, code: string, methodId: string) => Promise<void>,
  sendTransaction: (tx: Transaction) => Promise<Hash>,
  logout: () => Promise<void>,
  address: Address | null,
  isAuthenticated: boolean,
  isLoading: boolean,
}
```

Example usage is in `packages/sdk/README.md` and `examples/nextjs-demo`.

---

## Storage helpers (browser-only)

- `storeUserShare(encryptedShare: string): Promise<void>`
- `getUserShare(): Promise<string | null>`
- `clearUserShare(): Promise<void>`

These use IndexedDB and must not be imported from server-side code.

---

## Types

Example `OnkeyConfig`:
```ts
export interface OnkeyConfig {
  backendUrl: string;
  chain: Chain; // from viem
  bundlerUrl: string;
  paymasterUrl: string;
  factoryAddress: Address;
  entryPointAddress: Address;
}
```

`Transaction` example:
```ts
export interface Transaction {
  to: Address;
  value?: bigint;
  data?: Hex;
}
```

`VerifyResponse` example (server response shape):
```ts
{ success: boolean; token: string; smartAccountAddress: Address; isNewUser: boolean; userShare?: string }
```

---

## Notes & Best Practices

- Keep `ENCRYPTION_KEY` secret on the server and do not embed in client builds.
- For production, ensure HTTPS and secure cookie or storage for tokens if you change storage strategy.
- TypeDoc: The SDK includes a `docs:typed` script (`pnpm --filter ./packages/sdk docs:typed`) which generates typed API docs into `docs/typed` (HTML). A GitHub Action is included to build TypeDoc on pushes to `main` and upload the generated docs as an artifact.
