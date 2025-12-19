# @onkey/sdk

Official SDK for integrating Onkey's MPC-based authentication and ERC-4337 account abstraction into React and Next.js applications.

## Requirements

- React 16.8+ or Next.js 12+
- Node.js 16+
- A running Onkey backend service
- Bundler and Paymaster RPC endpoints (e.g., Pimlico, Alchemy)

## Installation

```bash
pnpm add @onkey/sdk
```

## Quick Start

This example shows the minimal setup needed to authenticate users:

```tsx
import { OnkeyProvider, useOnkey } from '@onkey/sdk';
import { baseSepolia } from 'viem/chains';

// 1. Configure and wrap your app
const config = {
  backendUrl: 'http://localhost:3001',
  chain: baseSepolia,
  bundlerUrl: 'https://api.pimlico.io/v2/xxx/rpc?apikey=KEY',
  paymasterUrl: 'https://api.pimlico.io/v2/xxx/rpc?apikey=KEY',
  factoryAddress: '0x...',
  entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
};

export default function App({ children }: { children: React.ReactNode }) {
  return <OnkeyProvider config={config}>{children}</OnkeyProvider>;
}

// 2. Use the hook in your components
function LoginForm() {
  const { login, verifyOTP, address, isAuthenticated } = useOnkey();

  const handleLogin = async () => {
    const methodId = await login('user@example.com');
    // Send OTP code to user
  };

  const handleVerify = async (code: string) => {
    await verifyOTP('user@example.com', code, methodId);
    console.log('Authenticated as:', address);
  };

  return isAuthenticated ? <p>Welcome!</p> : <p>Please sign in</p>;
}
```

## Configuration

| Option | Type | Required | Description |
|------|-----|---------|------------|
| `backendUrl` | string | Yes | Your Onkey backend service endpoint |
| `chain` | Chain | Yes | Target EVM chain (e.g., `baseSepolia` from viem/chains) |
| `bundlerUrl` | string | Yes | ERC-4337 bundler RPC endpoint |
| `paymasterUrl` | string | Yes | Paymaster RPC endpoint for gasless transactions |
| `factoryAddress` | string | Yes | OnkeyAccountFactory contract address |
| `entryPointAddress` | string | Yes | ERC-4337 EntryPoint contract address |

## Authentication

Use the `useOnkey()` hook to access authentication methods:

```tsx
const {
  login,           // (email: string) => Promise<string> (methodId)
  verifyOTP,       // (email, code, methodId) => Promise<void>
  logout,          // () => Promise<void>
  address,         // string | null
  isAuthenticated, // boolean
  isLoading,       // boolean
} = useOnkey();
```

## Examples

### Send a Gasless Transaction

```tsx
const { sendTransaction } = useOnkey();

const txHash = await sendTransaction({
  to: '0x...',
  value: '1000000000000000000', // 1 ETH in wei
  data: '0x',
});
```

### Logout User

```tsx
const { logout } = useOnkey();
await logout();
```

## Important: Storage & Browser Environment

The SDK uses **IndexedDB** for encrypted key shares and **localStorage** for tokens:

- ⚠️ Do **not** import or use the SDK on the server side (SSR, API routes)
- Use Next.js 13+ `'use client'` directive or dynamic imports with `ssr: false`
- Storage initialization only happens in the browser

## More Documentation

For full API documentation, advanced usage, and platform concepts, see:
https://github.com/somehowliving/onkey 


## License

MIT - See [LICENSE](../../LICENSE)

## Support & Resources

- 📚 [Onkey Documentation](https://github.com/somehowliving/onkey/README.md)
- 🐛 [Issue Tracker](https://github.com/somehowliving/onkey/CONTRIBUTING.md)
- 💬 [Discussions](https://github.com/somehowliving/onkey/onkey_technical_docs.md)
- 📖 [Examples](https://github.com/somehowliving/onkey/examples)

## License

MIT - See [LICENSE](../../LICENSE) file for details

---

**Version:** Check [package.json](./package.json) for current version  
**Updated:** December 2025
