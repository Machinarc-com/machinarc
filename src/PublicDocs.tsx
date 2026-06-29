import { LogoMark } from "./Logo";

const GITHUB_URL = "https://github.com/machinarc";

function Mono({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-[#1a1413]/12 bg-[#1a1413] p-4 font-mono text-xs leading-6 text-[#efe6de]">
      {children}
    </pre>
  );
}

const endpoints: [string, string, string][] = [
  ["POST", "/v1/agents", "Create an agent."],
  ["GET", "/v1/agents", "List agents."],
  ["GET", "/v1/agents/:id", "Retrieve an agent."],
  ["PATCH", "/v1/agents/:id", "Update an agent."],
  ["DELETE", "/v1/agents/:id", "Revoke an agent."],
  ["POST", "/v1/verify", "Verify identity + permission."],
  ["POST", "/v1/api-keys", "Create an API key."],
  ["GET", "/v1/audit-logs", "List audit logs."],
];

export default function PublicDocs({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return (
    <div className="min-h-screen [overflow-x:clip] bg-[#efe6de] text-[#1a1413]">
      <header className="sticky top-0 z-50 border-b border-[#1a1413]/10 bg-[#efe6de]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={onBack} className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight">Machinarc Docs</span>
          </button>
          <div className="flex items-center gap-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002] sm:inline"
            >
              GitHub
            </a>
            <button
              onClick={onStart}
              className="rounded-md bg-[#9a0002] px-4 py-2 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426]"
            >
              Start free
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-14 px-5 py-16 sm:px-8">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">Documentation</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Quick start</h1>
          <p className="mt-4 text-[#1a1413]/70">Scope an agent and verify it in a few lines.</p>

          <div className="mt-6 space-y-4">
            <p className="font-medium">1. Install the SDK</p>
            <Mono>npm install @machinarc/sdk</Mono>
            <p className="font-medium">2. Create and scope an agent</p>
            <Mono>{`import { Machinarc } from "@machinarc/sdk";

const client = new Machinarc({ apiKey: process.env.MACHINARC_API_KEY });

const agent = await client.agents.create({
  name: "Support Agent",
  capabilities: ["email.read", "email.send"],
});`}</Mono>
            <p className="font-medium">3. Verify before acting</p>
            <Mono>{`const result = await client.verify({
  agentId: agent.id,
  token: process.env.MACHINARC_SECRET_KEY,
});

// dangerous actions outside the agent's scope return 403 — blocked.`}</Mono>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Authentication</h2>
          <p className="mt-3 text-[#1a1413]/70">Send your API key as a bearer token.</p>
          <div className="mt-4">
            <Mono>{`curl https://api.machinarc.com/v1/agents \\
  -H "Authorization: Bearer mk_live_..."`}</Mono>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Verification response</h2>
          <div className="mt-4">
            <Mono>{`{
  "verified": true,
  "agent": { "id": "ag_01HJ8F92", "name": "Support Agent", "status": "healthy" },
  "permissions": ["email.read", "email.send"],
  "verified_at": "2026-06-29T14:22:00Z"
}`}</Mono>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight">API reference</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8]">
            {endpoints.map(([m, p, d]) => (
              <div
                key={`${m}-${p}`}
                className="flex flex-col gap-1 border-b border-[#1a1413]/10 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className={`w-16 shrink-0 font-mono text-xs font-semibold ${m === "GET" ? "text-[#1a7a31]" : "text-[#9a0002]"}`}>
                  {m}
                </span>
                <span className="w-44 shrink-0 font-mono text-sm">{p}</span>
                <span className="text-sm text-[#1a1413]/65">{d}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Troubleshooting</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1413]/70">
            <li>• <span className="font-mono text-[#9a0002]">INVALID_TOKEN</span> — check the API key and bearer header.</li>
            <li>• <span className="font-mono text-[#9a0002]">PERMISSION_DENIED</span> — the agent's policy doesn't allow that scope.</li>
            <li>• <span className="font-mono text-[#9a0002]">AGENT_DISABLED</span> — resume or recreate the agent.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-[#1a1413]/10 bg-[#efe6de]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-8 text-sm text-[#1a1413]/60 sm:px-8">
          <button onClick={onBack} className="hover:text-[#9a0002]">Back to home</button>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-[#9a0002]">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
