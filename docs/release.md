# Release & Publishing Guide

This guide explains how to publish `@onkey/sdk` and general release conventions.

## Versioning
- Use SemVer (MAJOR.MINOR.PATCH)
- Prefer Conventional Commits to drive changelog generation

## Build & Publish (manual)

```bash
# build the workspace
pnpm build

# publish the SDK package
cd packages/sdk
pnpm publish --access public
```

> Tip: Use `pnpm --filter ./packages/sdk publish` from repo root when publishing from monorepo.

## Automation (recommended)
- Use GitHub Actions with `semantic-release` or `changesets` to automate changelog, versioning, and npm publishing.
- Add a workflow that runs on `push` to `main` and when you're ready to publish releases.

### Semantic-Release (SDK package)
We provide a minimal GitHub Actions workflow that runs `semantic-release` in `packages/sdk` and publishes to npm when enabled. To enable automated releases:

1. Set the following repository secrets in GitHub: `NPM_TOKEN` (npm publish token), and `SEMANTIC_RELEASE` set to `true` when you want semantic releases to run.
2. Ensure `packages/sdk/package.json` is not `private` (set `"private": false`) and contains a valid `name` and `version`.
3. The workflow will run `pnpm dlx semantic-release --cwd packages/sdk` and create releases, changelog entries, and publish to npm.

> Note: We intentionally require the `SEMANTIC_RELEASE` secret flag to avoid accidental publishing; flip it to `true` when you expect external users.

### Example (concept)
- `semantic-release` reads Conventional Commits and publishes on merge to `main` (when enabled).

## Changelog
- Use Conventional Commits to create concise changelogs automatically.

## Additional notes
- Ensure `package.json` in `packages/sdk` contains the correct `name`, `version`, `exports` and `files` fields and that `build` script outputs compiled files to `dist/`.
- Add README and `types` entry for TypeScript consumers.

If you want, I can add a GitHub Actions workflow template for publishing and a `semantic-release` config file.
