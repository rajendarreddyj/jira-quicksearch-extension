# Contributing Guide

Thanks for your interest in contributing to Jira Quick Search.

## Prerequisites

- Node.js 18+
- npm
- Git

## Build and Verify

```bash
npm install
npm run lint
npm run build
```

## Project Structure

- Source code: `src/`
- Static assets: `public/`
- Workflows: `.github/workflows/`
- Docs: `docs/`

## Coding Standards

- Follow repository instructions in [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Keep changes focused and minimal
- Preserve type safety in TypeScript code
- Avoid introducing insecure patterns (especially for credential handling)

## Development Workflow

1. Create a branch from `main`
2. Implement changes with tests/verification where applicable
3. Run `npm run lint` and `npm run build`
4. Update docs when behavior or configuration changes
5. Open a pull request with:
   - Problem statement
   - Summary of changes
   - Verification notes

## Communication

- Bugs and feature requests: GitHub Issues
- Security concerns: do not open issues; see [SECURITY.md](SECURITY.md)
