# Onkey

**Self-hosted, privacy-first authentication for Web3**

Give your users Web2-style logins (email, phone, passkeys) with smart contract wallets under the hood—all running on your own infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

```bash
# One command to deploy everything
docker-compose up

# That's it. You now have production-grade Web3 auth.
```

---

## The Problem

Most crypto products force users to:
- Install browser extensions (MetaMask, Rainbow)
- Write down 12-word seed phrases
- Pay gas fees to do anything
- Understand private keys, signing, and transaction concepts

**Result:** 99% of potential users never make it past onboarding.

### Current Solutions (And Why They're Broken)

**Option 1: Centralized Wallets (Privy, Magic, Dynamic)**
- ❌ Your users' keys live on someone else's servers
- ❌ Black-box custody—you can't audit what happens to keys
- ❌ Vendor lock-in—migrating off costs months of engineering
- ❌ Privacy concerns—they see all your users' onchain activity
- ❌ Expensive at scale—$0.05+ per monthly active user

**Option 2: MetaMask + WalletConnect**
- ❌ Requires browser extension installation
- ❌ Users manage their own keys (security nightmare for normies)
- ❌ Still need ETH for gas
- ❌ Mobile experience is clunky

**Option 3: Smart Contract Wallets (Safe, Argent)**
- ✅ Better UX, gasless transactions
- ❌ Still requires users to set up an EOA wallet first
- ❌ No embedded auth solution for developers

---

## The Solution: Onkey

**Onkey is the missing infrastructure layer between Auth0 and ERC-4337.**

We give developers a complete auth + wallet SDK that:
- ✅ **Runs on your infrastructure** (AWS, GCP, VPS, Kubernetes)
- ✅ **Open-source** (MIT license)—audit every line of code
- ✅ **Privacy-first MPC**—no single party ever holds the full private key
- ✅ **Smart account wallets**—gasless transactions, batching, recovery
- ✅ **Web2 login methods**—email, phone, passkeys (Telegram/Twitter coming Phase 2)

### What Your Users Experience

```
User clicks: "Login with Email"
   ↓
Receives OTP code
   ↓
Enters code
   ↓
✨ LOGGED IN ✨
Has a wallet. Can send crypto. No extension needed.
```

From the user's perspective: **"I logged in with my email and sent $10 USDC. Took 20 seconds."**

From your perspective: **"I own the auth infrastructure. Zero vendor lock-in. Full control."**

---

## How It Works

### Architecture in 60 Seconds

```
┌─────────────────┐
│   Your App      │  User logs in with email
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   Onkey Backend (You Host)  │
│                             │
│  • Email OTP                │
│  • Session management       │
│  • MPC coordination         │
└────────┬────────────────────┘
         │
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ MPC    │ │ MPC    │  2-of-2 threshold signing
│ Share A│ │ Share B│  Neither party has full key
│(Server)│ │(Device)│
└────┬───┘ └───┬────┘
     │         │
     └────┬────┘
          ▼
    Private Key Fragment
          │
          ▼
┌───────────────────────┐
│  Smart Account Wallet │  ERC-4337 Account Abstraction
│                       │
│  • Gasless txs        │
│  • Batched operations │
│  • Social recovery    │
└───────────────────────┘
```

### The Key Innovation: Privacy-First MPC

**Traditional wallet providers (Privy, Magic):**
```
User → Their servers → Full private key stored there
```
❌ Single point of failure  
❌ Must trust the provider  
❌ They can see everything  

**Onkey:**
```
User Device → MPC Share A
Your Server → MPC Share B
→ Combined only at signing time → Transaction signed
```
✅ No single party has the full key  
✅ Even if your server is compromised, keys are safe  
✅ Even if user's device is stolen, keys are safe  
✅ You can audit the entire flow  

---

## Why Onkey?

### For Developers

| Feature | Onkey | Privy | MetaMask | Safe |
|---------|-------|-------|----------|------|
| Self-hosted | ✅ | ❌ | N/A | ❌ |
| Open-source | ✅ | ❌ | ✅ | ✅ |
| No vendor lock-in | ✅ | ❌ | ✅ | ❌ |
| Privacy-first | ✅ | ❌ | ✅ | ⚠️ |
| Gasless transactions | ✅ | ✅ | ❌ | ✅ |
| Email login | ✅ | ✅ | ❌ | ❌ |
| Free at scale | ✅ | ❌ | ✅ | ✅ |
| Production-ready | 🚧 MVP | ✅ | ✅ | ✅ |

### For End Users

**With MetaMask:**
1. Download extension
2. Create wallet
3. Write down seed phrase (scary!)
4. Buy ETH on exchange
5. Transfer ETH to wallet
6. Pay gas for every transaction

**With Onkey:**
1. Enter email
2. Enter OTP code
3. ✅ Done. Can now send crypto.

### For Enterprises & DAOs

- **Compliance:** Run on your own infrastructure in your jurisdiction
- **Privacy:** User activity never leaves your servers
- **Auditability:** Every line of code is inspectable
- **Control:** Customize recovery flows, signing policies, spending limits

---

## What You Get (Phase 1 MVP)

### 📦 Frontend SDK (`@onkey/sdk`)

```typescript
import { OnkeyProvider, useOnkey } from '@onkey/sdk';

function App() {
  return (
    <OnkeyProvider config={{ backendUrl: 'https://your-api.com' }}>
      <YourApp />
    </OnkeyProvider>
  );
}

function SendMoneyButton() {
  const { login, sendTransaction, address } = useOnkey();
  
  const handleSend = async () => {
    await login('user@example.com');
    // User receives OTP, enters it...
    
    // Send USDC without user needing ETH for gas
    await sendTransaction({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      value: parseEther('0.01'),
    });
  };
  
  return <button onClick={handleSend}>Send $10</button>;
}
```

### 🐳 Self-Hosted Backend

```bash
# Clone and deploy
git clone https://github.com/yourusername/onkey
cd onkey
cp .env.example .env
# Edit .env with your config

docker-compose up -d

# That's it. Your auth infrastructure is running.
```

**Includes:**
- Email OTP service
- MPC key generation & signing
- Session management
- Encrypted key storage (Postgres)
- Rate limiting
- Monitoring endpoints

### 🔐 Smart Contract Wallets

- ERC-4337 compliant accounts
- Gasless transactions (via Pimlico paymaster)
- Counterfactual deployment (address exists before first tx)
- Based on battle-tested Kernel v2 (ZeroDev)

### 📚 Complete Documentation

- Quick start guide
- API reference
- Self-hosting guide
- Security best practices
- Migration guides

---

## Use Cases

### 🎮 Gaming
"Login with email → get wallet → buy in-game items"
- No MetaMask friction = 10x more conversions
- Gasless transactions = players never think about blockchain
- Your own infra = no revenue split with wallet providers

### 💰 DeFi
"Email login → deposit USDC → earn yield"
- Onboard users who don't have MetaMask
- Sponsor gas for small deposits
- Keep user activity private from third parties

### 🎨 NFT Marketplaces
"Login with email → mint NFT → list for sale"
- Gasless minting campaigns
- User never needs to understand "gas" or "signing"
- You control the recovery flow for lost accounts

### 🏦 Fintech / Neobanks
"Embed crypto capabilities in your existing app"
- Run on your own AWS/GCP infrastructure
- Full compliance control
- Audit trail for every transaction
- White-label the entire experience

### 🌐 Web3 Social
"Login with email → tip creators → buy social tokens"
- Seamless onboarding = more users
- Gasless tipping = better UX
- Privacy-first = users trust you more

---

## Roadmap

### ✅ Phase 1: MVP (Shipping Now)
- Email OTP login
- 2-of-2 MPC with Lit Protocol
- ERC-4337 smart accounts
- Gasless transactions
- Docker self-hosting
- React SDK

### 🚧 Phase 2: "Privy Feature Parity" (Q1 2025)
- Passkey login (WebAuthn)
- Telegram login
- Twitter/X login
- Social recovery modules
- Session keys
- Multi-chain support (Polygon, Arbitrum, Optimism)

### 🔮 Phase 3: "Platform" (Q2 2025)
- Mobile SDKs (React Native, Swift, Kotlin)
- Admin dashboard
- Analytics & monitoring
- Optional hosted MPC service
- Compliance modules (KYC hooks, transaction limits)
- Cross-app identity protocol

---

## Philosophy

### Why Open Source?

**"Infrastructure for user ownership should itself be owned by users."**

Wallet infrastructure is too important to be controlled by a single company. Developers should be able to:
- Audit the code that handles their users' keys
- Self-host to maintain sovereignty
- Contribute features they need
- Fork if they disagree with our direction

### Why Self-Hosted?

**"The only way to truly own your keys is to own the infrastructure."**

Even with MPC, if you don't control the servers, you don't control the keys. We believe:
- Developers should own their auth infrastructure
- Users' privacy should be protected by default
- Vendor lock-in is anti-pattern in Web3

### Why Privacy-First?

**"Web3 promised privacy. Most wallets broke that promise."**

When you use centralized wallet providers:
- They see every wallet you create
- They link your email to your address
- They can track your onchain activity
- They build profiles on your users

With Onkey:
- No single party sees the full key
- You decide what logs to keep
- Users' onchain activity stays private
- No data mining, ever

---

## Security

### Threat Model

**What Onkey Protects Against:**
- ✅ Server compromise (attacker needs user's device too)
- ✅ Device theft (attacker needs server share too)
- ✅ MitM attacks (shares are encrypted in transit)
- ✅ Database leaks (shares encrypted at rest)
- ✅ Insider threats (no single admin has full access)

**What You Still Need to Handle:**
- Physical security of your servers
- Key rotation policies
- User device backups
- Recovery flows for lost access

### Audits

**Status:** Pre-audit (MVP phase)

**Planned:** Full smart contract audit + cryptography review before Phase 2 launch.

**Bug Bounty:** Coming Q1 2025

---

## Community

- **GitHub:** [github.com/yourusername/onkey](https://github.com/yourusername/onkey)
- **Discord:** [discord.gg/onkey](https://discord.gg/onkey) (coming soon)
- **Twitter:** [@OnkeyAuth](https://twitter.com/OnkeyAuth) (coming soon)
- **Docs:** [docs.onkey.dev](https://docs.onkey.dev) (coming soon)

### Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Areas we need help:**
- 🔐 Security reviews
- 📝 Documentation
- 🧪 Test coverage
- 🌐 i18n translations
- 🎨 UI/UX improvements

---

## FAQ

**Q: Is this production-ready?**  
A: Phase 1 MVP is in beta. Use on testnets for now. Production launch Q1 2025.

**Q: How much does it cost to run?**  
A: ~$50-100/month for a small app (DigitalOcean/AWS). No per-user fees. Scales linearly with usage.

**Q: Can users recover their accounts if they lose access?**  
A: Yes. Social recovery is coming in Phase 2. For now, you control the server share and can implement custom recovery flows.

**Q: What if Onkey disappears?**  
A: You own the code. You own the infrastructure. Fork it. The smart accounts are non-custodial and will keep working.

**Q: Is this really as secure as MetaMask?**  
A: Different security model. MetaMask = user holds 1 key. Onkey = 2-of-2 MPC. Both parties needed to sign. Arguably more secure for average users.

**Q: Do I need to know blockchain development?**  
A: No. We abstract away the complexity. If you can build a React app and deploy a Docker container, you can use Onkey.

**Q: Can I use this with my existing auth system?**  
A: Yes! Onkey can work alongside Auth0, Firebase, etc. Just call our SDK when you need wallet functionality.

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/onkey
cd onkey

# 2. Set up environment
cp .env.example .env
# Edit .env with your config

# 3. Start the stack
docker-compose up -d

# 4. Deploy smart contracts (testnet)
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast

# 5. Try the demo
cd examples/nextjs-demo
pnpm install
pnpm dev
```

Visit `http://localhost:3000` and login with your email. You now have a smart account wallet.

**Full documentation:** [docs.onkey.dev/quickstart](https://docs.onkey.dev/quickstart)

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

**What this means:**
- ✅ Use commercially
- ✅ Modify as you need
- ✅ Distribute freely
- ✅ Private use
- ⚠️ No warranty provided

---

## Star History

If you find Onkey useful, give us a star! It helps others discover the project.

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/onkey&type=Date)](https://star-history.com/#yourusername/onkey&Date)

---

**Built with ❤️ by developers who believe Web3 should be accessible to everyone.**

Not just crypto natives. Everyone.