# PowerShell setup script for Windows

Write-Host "🚀 Setting up Onkey..." -ForegroundColor Green

# Check for required tools
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Setup environment
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env file with your configuration" -ForegroundColor Yellow
}

# Setup Prisma
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
Set-Location packages/backend
pnpm db:generate
Set-Location ../..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Edit .env file with your configuration"
Write-Host "2. Run 'docker-compose up -d' to start services"
Write-Host "3. Run 'cd packages/backend && pnpm db:migrate' to run migrations"
Write-Host "4. Start backend: 'cd packages/backend && pnpm dev'"
Write-Host "5. Start demo: 'cd examples/nextjs-demo && pnpm dev'"

