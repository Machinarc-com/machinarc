# Contributing to Machinarc

Thanks for your interest in improving Machinarc. This guide covers how to get set
up and submit changes.

## Getting started

1. Fork and clone the repository.
2. Install dependencies and run the frontend:
   ```bash
   npm install
   npm run dev
   ```
3. (Optional) Run the backend:
   ```bash
   cd backend
   cp .env.example .env
   docker compose up --build
   ```

## Development workflow

- Create a branch from `main`: `git checkout -b feat/short-description`
- Keep changes focused; one logical change per pull request.
- Make sure the build passes before opening a PR:
  ```bash
  npm run build
  ```
- Use clear, conventional commit messages (e.g. `feat: add agent rotation`,
  `fix: handle revoked api keys`).

## Code style

- TypeScript + React for the frontend; Python (PEP 8) for the backend.
- Prefer small, composable components and functions.
- No secrets or credentials in commits — use environment variables.

## Pull requests

- Describe what changed and why.
- Link related issues.
- Include screenshots for UI changes.
- Be responsive to review feedback.

## Reporting bugs

Open an issue with steps to reproduce, expected vs. actual behavior, and your
environment. For security issues, see [SECURITY.md](SECURITY.md) instead.

## Code of conduct

By participating you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).
