# Contributing to Onkey

Thank you for your interest in contributing to Onkey! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and configure
4. Start services: `docker-compose up -d`
5. Run migrations: `cd packages/backend && pnpm db:migrate`

## Code Style

- Use TypeScript strict mode
- Follow existing code style
- Run `pnpm lint` before committing
- Write meaningful commit messages

## Testing

- Backend: `cd packages/backend && pnpm test`
- Contracts: `cd packages/contracts && forge test`
- SDK: `cd packages/sdk && pnpm test`

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Ensure all tests pass
5. Submit a pull request with a clear description

## Security

- Never commit secrets or keys
- Report security issues privately
- Follow security best practices

## Questions?

Open an issue or reach out on Discord (coming soon).

