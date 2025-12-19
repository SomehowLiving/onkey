# Examples

This file shows short, copy-paste examples and points to `examples/nextjs-demo` for a runnable demo.

## 1) Login flow (frontend)

```tsx
// inside a component with useOnkey()
const { login, verifyOTP } = useOnkey();

// send OTP
const methodId = await login('user@example.com');

// later, verify
await verifyOTP('user@example.com', '123456', methodId);
```

## 2) Sending a gasless transaction

```tsx
const { sendTransaction } = useOnkey();

const txHash = await sendTransaction({
  to: '0xRecipientAddress',
  value: BigInt('1000000000000000'),
});
```

## 3) Server vs Client boundaries

- **Do** keep sensitive keys and `ENCRYPTION_KEY` on the server only.
- **Do not** import `storage.ts` helpers on server-side code (they access `indexedDB` and `window`).

## 4) Demo app

See `examples/nextjs-demo` for a working demo that demonstrates login, verify and sending transactions.
