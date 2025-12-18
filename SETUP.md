# Onkey Setup Guide

This guide will help you set up Onkey for local development and production deployment.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd onkey
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://onkey:password@localhost:5432/onkey

# Backend Secrets (generate strong random values)
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Email (use Resend, SendGrid, or your SMTP)
EMAIL_HOST=smtp.resend.com
EMAIL_USER=resend
EMAIL_PASS=re_your_api_key
EMAIL_FROM=auth@yourdomain.com

# Pimlico API (get keys from https://pimlico.io)
BUNDLER_URL=https://api.pimlico.io/v2/84532/rpc?apikey=YOUR_KEY
PAYMASTER_URL=https://api.pimlico.io/v2/84532/rpc?apikey=YOUR_KEY
```

### 3. Start Services

Start PostgreSQL and Redis with Docker:

```bash
docker-compose up -d postgres redis
```

Or start everything:

```bash
docker-compose up -d
```

### 4. Setup Database

```bash
cd packages/backend
pnpm db:generate
pnpm db:migrate
```

### 5. Start Backend

```bash
cd packages/backend
pnpm dev
```

Backend will run on `http://localhost:3001`

### 6. Start Demo App

In a new terminal:

```bash
cd examples/nextjs-demo
pnpm dev
```

Demo app will run on `http://localhost:3000`

## Production Deployment

### Using Docker Compose

1. Set all environment variables in `.env`
2. Build and start:

```bash
docker-compose build
docker-compose up -d
```

### Manual Deployment

1. **Backend**:
   ```bash
   cd packages/backend
   pnpm build
   pnpm start
   ```

2. **MPC Service**:
   ```bash
   cd packages/mpc
   pnpm build
   pnpm start
   ```

3. **Frontend SDK**: Publish to npm or use as workspace dependency

## Smart Contract Deployment

Deploy to Base Sepolia:

```bash
cd packages/contracts

# Install dependencies
forge install account-abstraction/account-abstraction@v0.6.0 --no-commit
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY
```

Update `FACTORY_ADDRESS` in your `.env` after deployment.

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `docker ps`
- Check connection string in `.env`
- Verify database exists: `psql -U onkey -d onkey`

### Email Not Sending

- Verify SMTP credentials
- Check email service logs
- For development, use a service like [Resend](https://resend.com) or [Mailtrap](https://mailtrap.io)

### MPC Service Errors

- Ensure Redis is running
- Check Lit Protocol network connectivity
- Verify encryption keys are set

### Frontend SDK Issues

- Ensure backend is running
- Check CORS settings in backend
- Verify environment variables in demo app

## Next Steps

- Read the [README.md](./README.md) for API documentation
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Explore the demo app in `examples/nextjs-demo`

## Support

- GitHub Issues for bugs
- Discord for dev support (coming soon)

