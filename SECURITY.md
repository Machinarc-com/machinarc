# Security Policy

## Reporting a vulnerability

We take the security of Machinarc seriously. If you discover a vulnerability,
please **do not open a public issue**.

Instead, email **support@machinarc.com** with:

- A description of the issue and its impact.
- Steps to reproduce (proof of concept if possible).
- Any relevant logs, requests, or screenshots.

We aim to acknowledge reports within 48 hours and to provide a remediation
timeline after triage.

## Supported versions

Machinarc is pre-1.0 and under active development. Security fixes are applied to
the latest `main` and the most recent release.

## Our practices

- Passwords and API key secrets are hashed (bcrypt); plaintext secrets are never
  stored and are shown only once on creation.
- Authentication uses signed JWT sessions.
- Agents operate under deny-by-default, scoped permissions.
- Every authenticated action is recorded in the audit log.

Please act in good faith, avoid privacy violations and service disruption, and
give us reasonable time to respond before any disclosure.
