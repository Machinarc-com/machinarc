import { LogoMark } from "./Logo";

const v1 = [
  ["Authentication", "Accounts, sessions, JWT."],
  ["Workspaces", "Multi-tenant workspaces."],
  ["Agent Identity", "Unique, verifiable agent identities."],
  ["API Keys", "Dev/prod keys, rotation, revocation."],
  ["Permission Policies", "Fine-grained authorization."],
  ["Audit Logs", "Complete activity transparency."],
  ["Verification API", "First trust service."],
  ["Official SDK", "TypeScript, with Python/Go/Rust planned."],
];

const phases = [
  {
    n: "01",
    title: "Foundation",
    objective: "Establish the platform's core infrastructure.",
    deliverables: ["Landing page", "User authentication", "Workspace management", "Dashboard shell", "PostgreSQL", "REST API foundation"],
    outcome: "Developers can create an account, a workspace, and access the dashboard.",
    done: true,
  },
  {
    n: "02",
    title: "Agent Identity",
    objective: "Give every AI agent a unique, verifiable identity.",
    deliverables: ["Agent creation", "Agent management", "Agent IDs", "Public/secret keys", "Agent detail pages", "Lifecycle management"],
    outcome: "Provision and manage AI agents via dashboard and API.",
    done: true,
  },
  {
    n: "03",
    title: "API Keys & Authentication",
    objective: "Secure access to the platform.",
    deliverables: ["API key generation", "Dev & production environments", "Key rotation", "Key revocation", "JWT authentication"],
    outcome: "Applications can securely authenticate with Machinarc.",
    done: true,
  },
  {
    n: "04",
    title: "Permission Policies",
    objective: "Fine-grained authorization for autonomous systems.",
    deliverables: ["Policy creation", "Permission management", "Policy assignment", "Access control", "Authorization engine"],
    outcome: "Every agent operates under explicit, auditable permissions.",
    done: true,
  },
  {
    n: "05",
    title: "Audit Logs",
    objective: "Complete visibility into agent activity.",
    deliverables: ["API request logging", "Authentication logs", "Permission logs", "Searchable history", "Export functionality"],
    outcome: "Complete transparency into every action performed.",
    done: true,
  },
  {
    n: "06",
    title: "Verification API",
    objective: "Establish the first trust service.",
    deliverables: ["Verification endpoint", "Identity validation", "Token validation", "Permission verification", "Standardized responses"],
    outcome: "Verify identity and authorization with a single API call.",
    done: true,
  },
  {
    n: "07",
    title: "Official SDKs",
    objective: "Deliver a world-class developer experience.",
    deliverables: ["TypeScript SDK", "API documentation", "Quick Start guide", "Example applications", "SDK reference"],
    outcome: "Integrate Machinarc into production with minimal code.",
    done: true,
  },
];

const future = [
  {
    title: "Trust Layer",
    body: "Machine trust through identity verification, reputation signals, signed attestations, trust scoring, and cryptographic verification.",
  },
  {
    title: "Machine-to-Machine Authentication",
    body: "Mutual authentication, secure service discovery, signed requests, and trust relationships between autonomous systems.",
  },
  {
    title: "Machine Payments",
    body: "Usage-based billing, micropayments, wallet management, and automated settlement.",
  },
  {
    title: "Reputation Network",
    body: "Reputation scores, reliability metrics, verification history, and community trust signals.",
  },
  {
    title: "Machine Network",
    body: "A global coordination layer where autonomous systems discover trusted peers and collaborate across boundaries.",
  },
];

export default function Roadmap({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return (
    <div className="min-h-screen [overflow-x:clip] bg-[#efe6de] text-[#1a1413]">
      <header className="sticky top-0 z-50 border-b border-[#1a1413]/10 bg-[#efe6de]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={onBack} className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight">Machinarc</span>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002]">
              Home
            </button>
            <button
              onClick={onStart}
              className="rounded-md bg-[#9a0002] px-4 py-2 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426]"
            >
              Start building
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Vision */}
        <section className="relative overflow-hidden border-b border-[#1a1413]/10">
          <div
            className="pointer-events-none absolute inset-0 mc-grid-drift opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#1a1413 1px, transparent 1px), linear-gradient(90deg, #1a1413 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-28">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">Roadmap</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Building the identity and trust infrastructure for autonomous systems.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#1a1413]/75">
              Machinarc provides the foundational services that let AI agents, robots, APIs, and intelligent machines
              securely identify themselves, authenticate, communicate, and operate at internet scale. Rather than
              building another AI application, we build the infrastructure autonomous software depends on.
            </p>
          </div>
        </section>

        {/* v1.0 */}
        <section className="border-b border-[#1a1413]/10 bg-[#e9ded3]">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">Shipped</p>
                <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Version 1.0</h2>
              </div>
              <span className="rounded-full bg-[#1a7a31]/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#1a7a31]">
                Available now
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#1a1413]/70">
              The identity and access management platform for AI agents and autonomous software.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {v1.map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-[#1a1413]/12 bg-[#efe6de] p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a7a31]/15 text-[11px] font-bold text-[#1a7a31]">
                      ✓
                    </span>
                    <h3 className="font-display text-base font-semibold">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#1a1413]/65">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Phases */}
        <section className="border-b border-[#1a1413]/10">
          <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">How we got here</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">The build, phase by phase.</h2>

            <div className="relative mt-12 space-y-6 border-l border-[#1a1413]/15 pl-8">
              {phases.map((p) => (
                <div key={p.n} className="relative">
                  <span className="absolute -left-[39px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#9a0002] text-[10px] font-bold text-[#efe6de]">
                    ✓
                  </span>
                  <div className="rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#1a1413]/40">{p.n}</span>
                      <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-[#1a1413]/70">{p.objective}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.deliverables.map((d) => (
                        <span key={d} className="rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-2.5 py-1 text-xs">
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-[#1a1413]/55">
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#9a0002]">Outcome</span>{" "}
                      {p.outcome}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Future */}
        <section className="border-b border-[#1a1413]/10 bg-[#e9ded3]">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">Exploring next · speculative</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Directions we're exploring — not commitments.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-[#1a1413]/60">
              These are speculative areas beyond v1. Timing and scope may change as we learn from early users.
            </p>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {future.map((f, i) => (
                <div key={f.title} className="rounded-2xl border border-[#1a1413]/12 bg-[#efe6de] p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                    <span className="font-mono text-[11px] text-[#1a1413]/30">0{i + 1}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#1a1413]/70">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Long-term vision */}
        <section className="relative overflow-hidden bg-[#1a1413] text-[#efe6de]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(#efe6de 1px, transparent 1px), linear-gradient(90deg, #efe6de 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#ff8a8c]">Long-term vision</p>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">
              Every autonomous system should have a secure identity, explicit permissions, verifiable trust, and complete
              operational transparency.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[#efe6de]/70">
              Just as cloud platforms became the backbone of modern web applications, Machinarc aims to become the
              identity, authentication, authorization, and trust layer for the Machine Economy.
            </p>
            <button
              onClick={onStart}
              className="mt-8 rounded-md bg-[#9a0002] px-6 py-3 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426] active:scale-[0.98]"
            >
              Start building
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-[#efe6de]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-[#1a1413]/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Machinarc — The identity layer for autonomous systems.</p>
          <button onClick={onBack} className="text-left transition-colors hover:text-[#9a0002] sm:text-right">
            Back to home
          </button>
        </div>
      </footer>
    </div>
  );
}
