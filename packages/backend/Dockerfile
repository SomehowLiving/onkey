FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/mpc/package.json ./packages/mpc/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
WORKDIR /app/packages/backend
RUN pnpm db:generate

# Build backend
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/node_modules ./node_modules
COPY --from=builder /app/packages/mpc ./packages/mpc
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/index.js"]


