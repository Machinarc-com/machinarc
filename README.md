<div align="center">

# Machinarc

**Identity and permissions for AI agents.**

AI agents inherit every permission your API key has. Machinarc gives each agent its own identity, scoped permissions, verification, and an audit trail — so one bad prompt can't wipe your production systems.

[Website](https://machinarc.com) · [Docs](https://machinarc.com) · [Report a bug](https://github.com/machinarc/machinarc/issues)

</div>

---

## What is Machinarc?

Machinarc is the security layer for autonomous systems. Instead of handing an AI agent your root API key, you give it:

- **Identity** — every agent gets a unique ID, public/secret key pair, and fingerprint.
- **Permissions** — scoped, deny-by-default policies (`email.read`, `payments.transfer`, …).
- **Verification** — confirm an agent's identity and authorization in a single API call.
- **Audit logs** — an immutable record of every allowed and blocked action.

The result: a dangerous action (delete data, email customers, move money) is **blocked** at the policy layer — not executed.

---

## Repository structure

```
.
├── src/                  # Frontend (React + Vite + Tailwind)
│   ├── App.tsx           # Routing / shell
│   ├── Landing.tsx       # Marketing site
│   ├── Auth.tsx          # Sign up / sign in / Google OAuth
│   ├── Dashboard.tsx     # Console: agents, keys, policies, verify, audit
│   ├── Roadmap.tsx       # Public roadmap
│   ├── PublicDocs.tsx    # Public docs
│   ├── Legal.tsx         # Terms + Privacy
│   ├── api.ts            # Typed backend client
│   ├── repo.ts           # Data layer (API or local-demo)
│   ├── store.ts          # Local-demo store
│   └── ...
├── backend/              # API (FastAPI + PostgreSQL + Alembic)
│   ├── app/              # Routers, models, schemas, security
│   ├── alembic/          # Database migrations
│   ├── Dockerfile
│   └── docker-compose.yml
├── public/               # Static assets (logo, favicon)
└── index.html
```

---

## Tech stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Frontend     | React 19, Vite, TypeScript, Tailwind CSS              |
| Backend      | FastAPI, Python 3.13, SQLAlchemy 2.0, Alembic         |
| Database     | PostgreSQL, Redis                                     |
| Auth         | JWT, API keys (bcrypt), Google OAuth 2.0              |
| Infra        | Docker, Vercel (web), Railway / Fly.io (api)          |

---

## Quick start

### Frontend

```bash
npm install
npm run dev        # local dev server
npm run build      # production build
```

By default the dashboard runs in local-demo mode (browser storage). To connect a
real backend, set the API URL and, if using Supabase OAuth, the Supabase client
configuration:

```bash
# .env
VITE_API_URL=https://api.machinarc.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend

```bash
cd backend
cp .env.example .env          # set JWT_SECRET, DB url, Google OAuth creds
docker compose up --build     # api + postgres + redis
```

API runs at `http://localhost:8000` · docs at `http://localhost:8000/docs`.

See [`backend/README.md`](backend/README.md) for details.

---

## SDK example

```typescript
import { Machinarc } from "@machinarc/sdk";

const machinarc = new Machinarc({ apiKey: process.env.MACHINARC_API_KEY });

const agent = await machinarc.agents.create({ name: "Support Agent" });

await agent.allow("email.read");
await agent.block("payments.transfer");

const result = await machinarc.verify({ agentId: agent.id, token });
```

---

## API overview

| Method   | Endpoint                       | Description                     |
| -------- | ------------------------------ | ------------------------------- |
| `POST`   | `/v1/auth/register`            | Create account + workspace      |
| `POST`   | `/v1/auth/login`               | Sign in                         |
| `POST`   | `/v1/agents`                   | Create an agent                 |
| `GET`    | `/v1/agents`                   | List agents                     |
| `PATCH`  | `/v1/agents/:id`               | Update an agent                 |
| `DELETE` | `/v1/agents/:id`               | Revoke an agent                 |
| `POST`   | `/v1/agents/:id/policies`      | Grant / deny a permission       |
| `POST`   | `/v1/verify`                   | Verify identity + permission    |
| `POST`   | `/v1/api-keys`                 | Create an API key               |
| `POST`   | `/v1/api-keys/:id/rotate`      | Rotate an API key               |
| `DELETE` | `/v1/api-keys/:id`             | Revoke an API key               |
| `GET`    | `/v1/audit-logs`               | List audit events               |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md) before opening a PR.

## Security

Found a vulnerability? Please follow [SECURITY.md](SECURITY.md) — do not open a
public issue for security reports.

## License

[MIT](LICENSE) © Machinarc
