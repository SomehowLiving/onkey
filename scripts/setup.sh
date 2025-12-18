#!/bin/bash

set -e

echo "🚀 Setting up Onkey..."

# Check for required tools
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "⚠️  Please edit .env file with your configuration"
fi

# Setup Prisma
echo "🗄️  Setting up database..."
cd packages/backend
pnpm db:generate

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'docker-compose up -d' to start services"
echo "3. Run 'cd packages/backend && pnpm db:migrate' to run migrations"
echo "4. Start backend: 'cd packages/backend && pnpm dev'"
echo "5. Start demo: 'cd examples/nextjs-demo && pnpm dev'"

