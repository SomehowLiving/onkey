# Contributing & API Changes

Thanks for contributing! This document explains how to propose changes and keep docs and API consistent.

## Making changes
- Fork and create a feature branch.
- Open a PR with a clear description and link to related issues.
- Add unit/integration tests when applicable.
- Update docs in `docs/` and `packages/sdk/README.md` for any API changes.

## API changes
- For non-breaking changes: increment MINOR version and document in changelog.
- For breaking changes: increment MAJOR version; create a migration guide in `docs/` and a `MIGRATION.md` when applicable.
- Use Conventional Commits so we can generate changelogs automatically.

## Review checklist
- [ ] Tests added/updated
- [ ] Docs updated
- [ ] Changelog entry (or commit following Conventional Commits)
- [ ] CI passes

If you'd like, I can add a GitHub PR template and CONTRIBUTING checklist as files in `.github/`.
