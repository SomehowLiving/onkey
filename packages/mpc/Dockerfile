FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages/mpc/package.json ./packages/mpc/

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/packages/mpc
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/packages/mpc/dist ./dist
COPY --from=builder /app/packages/mpc/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]


