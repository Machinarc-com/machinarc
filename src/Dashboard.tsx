import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_CAPABILITIES,
  PERMISSION_GROUPS,
  clockTime,
  createAgent,
  createKey,
  deleteAgent,
  exportLogsCsv,
  exportLogsJson,
  loadDB,
  relativeTime,
  renameWorkspace,
  saveDB,
  setPolicy,
  toPublic,
  verify,
  verifyAgent,
  type Agent,
  type Capability,
  type DB,
  type LogEntry,
  type Session,
} from "./store";
import { Toaster, toast } from "./toast";
import * as repo from "./repo";
import { LogoMark } from "./Logo";

type Tab = "overview" | "demo" | "agents" | "keys" | "policies" | "verify" | "logs" | "api" | "sdk" | "docs" | "settings";

const sidebar: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "demo", label: "Demo" },
  { id: "agents", label: "Agents" },
  { id: "keys", label: "API Keys" },
  { id: "policies", label: "Policies" },
  { id: "verify", label: "Verify" },
  { id: "logs", label: "Audit Logs" },
  { id: "api", label: "API Playground" },
  { id: "sdk", label: "SDK" },
  { id: "docs", label: "Documentation" },
  { id: "settings", label: "Settings" },
];

function statusColor(status: Agent["status"]) {
  if (status === "active") return "bg-[#1a7a31]";
  if (status === "paused") return "bg-[#b08900]";
  return "bg-[#9a0002]";
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] ${className}`}>{children}</div>;
}

function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {sub ? <p className="mt-2 text-sm text-[#1a1413]/60">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

function Mono({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-[#1a1413]/12 bg-[#1a1413] p-4 font-mono text-xs leading-6 text-[#efe6de]">
      {children}
    </pre>
  );
}

const primaryBtn =
  "rounded-md bg-[#9a0002] px-4 py-2 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426] active:scale-[0.98]";
const ghostBtn =
  "rounded-md border border-[#1a1413]/20 px-4 py-2 text-sm font-medium text-[#1a1413] transition-colors hover:border-[#9a0002] hover:text-[#9a0002]";

export default function Dashboard({
  session,
  onSession,
  onSignOut,
}: {
  session: Session;
  onSession: (s: Session) => void;
  onSignOut: () => void;
}) {
  const [db, setDb] = useState<DB | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    repo
      .snapshot()
      .then(setDb)
      .catch(() => {
        toast("Could not load workspace data", "error");
        setDb({ agents: [], apiKeys: [], logs: [] });
      });
  }, []);

  const refresh = async () => {
    try {
      setDb(await repo.snapshot());
    } catch {
      toast("Could not refresh data", "error");
    }
  };

  // local-only setter used by sandbox tools (Demo, API Playground) — local mode only
  const commit = (next: DB) => {
    saveDB(next);
    setDb(next);
  };

  const go = (next: Tab) => {
    setTab(next);
    setSelectedAgentId(null);
    setMenuOpen(false);
  };

  const visibleSidebar = repo.usingApi ? sidebar.filter((s) => s.id !== "demo" && s.id !== "api") : sidebar;

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efe6de] text-[#1a1413]">
        <div className="flex items-center gap-3 text-sm text-[#1a1413]/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#9a0002]/30 border-t-[#9a0002]" />
          Loading workspace…
        </div>
      </div>
    );
  }

  const selectedAgent = db.agents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <div className="min-h-screen [overflow-x:clip] bg-[#efe6de] text-[#1a1413]">
      <Toaster />
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#1a1413]/10 bg-[#efe6de]/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-lg font-semibold">Machinarc</span>
        </div>
        <button type="button" onClick={() => setMenuOpen((v) => !v)} className="rounded-md border border-[#1a1413]/20 px-3 py-1.5 text-sm">
          Menu
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={`${
            menuOpen ? "block" : "hidden"
          } w-full border-b border-[#1a1413]/10 px-4 py-4 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-6`}
        >
          <div className="mb-8 hidden items-center gap-3 lg:flex">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight">Machinarc</span>
          </div>
          <nav className="space-y-1" aria-label="Sidebar">
            {visibleSidebar.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  tab === item.id ? "bg-[#9a0002] text-[#efe6de]" : "text-[#1a1413]/70 hover:bg-[#1a1413]/5 hover:text-[#1a1413]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-[#1a1413]/10 pt-4 text-sm">
            <p className="truncate text-[#1a1413]">{session.email}</p>
            <p className="mt-1 text-xs text-[#1a1413]/50">{session.org}</p>
            <button onClick={onSignOut} className="mt-3 text-xs text-[#9a0002] hover:underline">
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-[#1a1413]/10 bg-[#efe6de]/85 px-8 py-3 backdrop-blur lg:flex lg:px-10">
            <p className="text-sm text-[#1a1413]/60">
              Workspace · <span className="font-medium text-[#1a1413]">{session.org}</span>
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[#1a1413]/55">{session.email}</span>
              <button onClick={onSignOut} className="rounded-md border border-[#1a1413]/15 px-3 py-1.5 text-[#1a1413]/70 transition-colors hover:border-[#9a0002] hover:text-[#9a0002]">
                Sign out
              </button>
            </div>
          </div>

          <div className="px-4 py-8 sm:px-8 lg:px-10">
          {tab === "overview" && <Overview db={db} onOpenAgents={() => go("agents")} onCreateAgent={() => go("agents")} />}
          {tab === "demo" && <Demo db={db} commit={commit} />}
          {tab === "agents" && !selectedAgent && <Agents db={db} refresh={refresh} onSelect={setSelectedAgentId} />}
          {tab === "agents" && selectedAgent && (
            <AgentDetail db={db} agent={selectedAgent} refresh={refresh} onBack={() => setSelectedAgentId(null)} />
          )}
          {tab === "keys" && <ApiKeys db={db} refresh={refresh} />}
          {tab === "policies" && <Policies db={db} refresh={refresh} />}
          {tab === "verify" && <Verify db={db} refresh={refresh} />}
          {tab === "logs" && <AuditLogs db={db} refresh={refresh} />}
          {tab === "api" && <ApiPlayground db={db} commit={commit} />}
          {tab === "sdk" && <Sdk />}
          {tab === "docs" && <Docs />}
          {tab === "settings" && <Settings session={session} onSession={onSession} commit={commit} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Overview({
  db,
  onOpenAgents,
  onCreateAgent,
}: {
  db: DB;
  onOpenAgents: () => void;
  onCreateAgent: () => void;
}) {
  const blocked = db.logs.filter((l) => l.result === "Blocked").length;
  const stats = [
    ["Agents", String(db.agents.length)],
    ["API keys", String(db.apiKeys.length)],
    ["Actions", String(db.logs.length)],
    ["Blocked", String(blocked)],
  ];

  if (db.agents.length === 0) {
    return (
      <div>
        <SectionTitle title="Overview" sub="Identity, permissions, and audit for your AI agents." />
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9a0002]/10 font-display text-2xl text-[#9a0002]">
            +
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold">Create your first agent</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#1a1413]/60">
            Agents are identities for autonomous software. Each one gets a secure key pair, fine-grained permissions,
            and a full audit trail.
          </p>
          <button onClick={onCreateAgent} className={`${primaryBtn} mt-6`}>
            Create Agent
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle title="Overview" sub="Identity, permissions, and audit for your AI agents." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#1a1413]/50">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Agents</h2>
            <button onClick={onOpenAgents} className="text-sm text-[#9a0002] hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-[#1a1413]/10">
            {db.agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColor(a.status)}`} />
                  <span className="text-sm">{a.name}</span>
                </div>
                <span className="font-mono text-xs text-[#1a1413]/50">{a.id}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Recent activity</h2>
          <div className="space-y-3">
            {db.logs.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-3 text-[#1a1413]/70">{l.action}</span>
                <span className={`font-mono text-xs ${l.result === "Blocked" ? "text-[#9a0002]" : "text-[#1a7a31]"}`}>
                  {l.result}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

type DemoStep = {
  key: string;
  label: string;
  caption: string;
  run: (db: DB) => DB;
  render: (db: DB) => React.ReactNode;
};

function findDemoAgent(db: DB) {
  return db.agents.find((a) => a.name === "Demo Agent");
}

function Demo({ db, commit }: { db: DB; commit: (db: DB) => void }) {
  const [step, setStep] = useState(-1); // -1 = not started
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const steps: DemoStep[] = useMemo(
    () => [
      {
        key: "account",
        label: "Create account",
        caption: "Sign up for Machinarc — your identity on the platform.",
        run: (d) => d,
        render: () => (
          <Mono>{`POST /v1/auth/register

{
  "email": "founder@acme.com",
  "password": "••••••••"
}

→ 201 Created  ·  session started`}</Mono>
        ),
      },
      {
        key: "workspace",
        label: "Create workspace",
        caption: "Workspaces isolate your agents, keys, and audit history.",
        run: (d) => d,
        render: () => (
          <Mono>{`POST /v1/workspaces

{ "name": "Acme Inc." }

→ ws_01HJ8F92  ·  active`}</Mono>
        ),
      },
      {
        key: "create",
        label: "Create AI agent",
        caption: "POST /v1/agents — a new identity with keys and a fingerprint.",
        run: (d) => {
          const cleaned = { ...d, agents: d.agents.filter((a) => a.name !== "Demo Agent") };
          return createAgent(cleaned, {
            name: "Demo Agent",
            description: "Public demo agent",
            environment: "production",
            capabilities: ["Email"],
          }).db;
        },
        render: (d) => {
          const a = findDemoAgent(d);
          if (!a) return null;
          return (
            <Mono>{JSON.stringify(
              { id: a.id, public_key: a.publicKey, fingerprint: a.fingerprint, status: "healthy" },
              null,
              2,
            )}</Mono>
          );
        },
      },
      {
        key: "key",
        label: "Generate API key",
        caption: "Issue a production bearer token to authenticate requests.",
        run: (d) => createKey(d, { name: "Demo Key", environment: "production", permissions: "full" }).db,
        render: (d) => {
          const k = d.apiKeys.find((x) => x.name === "Demo Key");
          if (!k) return null;
          return <Mono>{`Authorization: Bearer ${k.token}`}</Mono>;
        },
      },
      {
        key: "permission",
        label: "Assign Email Read policy",
        caption: "Grant email.read — and nothing else.",
        run: (d) => {
          const a = findDemoAgent(d);
          if (!a) return d;
          return setPolicy(d, a.id, "gmail:read", true);
        },
        render: (d) => {
          const a = findDemoAgent(d);
          if (!a) return null;
          return (
            <Mono>{JSON.stringify(
              { agent: a.id, allow: ["email.read"], deny: ["email.delete", "payments.transfer"] },
              null,
              2,
            )}</Mono>
          );
        },
      },
      {
        key: "verify",
        label: "Call verification endpoint",
        caption: "POST /v1/verify — confirm identity, token, and permissions.",
        run: (d) => {
          const a = findDemoAgent(d);
          if (!a) return d;
          return verify(d, { agentId: a.id, token: a.secretKey, require: "email.read" }).db;
        },
        render: (d) => {
          const a = findDemoAgent(d);
          if (!a) return null;
          const result = verify(d, { agentId: a.id, token: a.secretKey, require: "email.read" }).result;
          return <Mono>{JSON.stringify(result, null, 2)}</Mono>;
        },
      },
      {
        key: "audit",
        label: "See the audit log",
        caption: "The verification request was recorded — fully traceable.",
        run: (d) => d,
        render: (d) => {
          const rows = d.logs.filter((l) => l.agent === "Demo Agent").slice(0, 5);
          return (
            <div className="overflow-hidden rounded-xl border border-[#1a1413]/12 bg-[#efe6de]">
              {rows.map((l) => (
                <div key={l.id} className="grid grid-cols-[60px_1fr_56px_64px] items-center gap-2 border-b border-[#1a1413]/10 px-3 py-2 text-xs last:border-b-0">
                  <span className="font-mono text-[#1a1413]/55">{clockTime(l.time)}</span>
                  <span className="truncate">{l.action}</span>
                  <span className="font-mono text-[#1a1413]/55">{l.latencyMs}ms</span>
                  <span className={`text-right font-mono ${l.result === "Blocked" ? "text-[#9a0002]" : "text-[#1a7a31]"}`}>
                    {l.result}
                  </span>
                </div>
              ))}
            </div>
          );
        },
      },
    ],
    [],
  );

  const advance = () => {
    setStep((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        setPlaying(false);
        return prev;
      }
      commit(steps[next].run(loadDB()));
      return next;
    });
  };

  useEffect(() => {
    if (!playing) return;
    if (step >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(advance, 1700);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step]);

  const start = () => {
    // reset demo artifacts
    const base = loadDB();
    const cleaned: DB = {
      ...base,
      agents: base.agents.filter((a) => a.name !== "Demo Agent"),
      apiKeys: base.apiKeys.filter((k) => k.name !== "Demo Key"),
      logs: base.logs.filter((l) => l.agent !== "Demo Agent"),
    };
    commit(cleaned);
    setStep(-1);
    setPlaying(true);
    setTimeout(advance, 200);
  };

  const progress = step < 0 ? 0 : Math.round(((step + 1) / steps.length) * 100);

  return (
    <div>
      <SectionTitle
        title="Demo"
        sub="Account → Workspace → Agent → API Key → Email Read policy → Verify → Audit log. Under two minutes."
        action={
          <div className="flex gap-2">
            <button className={primaryBtn} onClick={start}>
              {step < 0 ? "Play demo" : "Replay"}
            </button>
            {step >= 0 && step < steps.length - 1 && (
              <button
                className={ghostBtn}
                onClick={() => {
                  setPlaying((p) => !p);
                }}
              >
                {playing ? "Pause" : "Resume"}
              </button>
            )}
          </div>
        }
      />

      {/* progress */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[#1a1413]/10">
        <div className="h-full bg-[#9a0002] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* step rail */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {steps.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <div
              key={s.key}
              className={`rounded-xl border p-4 transition-colors ${
                state === "active"
                  ? "border-[#9a0002] bg-[#9a0002] text-[#efe6de]"
                  : state === "done"
                    ? "border-[#1a7a31]/30 bg-[#1a7a31]/10"
                    : "border-[#1a1413]/12 bg-[#f5efe8]"
              }`}
            >
              <p className={`font-mono text-[11px] ${state === "active" ? "text-[#efe6de]/70" : "text-[#1a1413]/45"}`}>
                Step {i + 1}
              </p>
              <p className="mt-1 text-sm font-semibold">{s.label}</p>
            </div>
          );
        })}
      </div>

      {step < 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-2xl font-semibold">The first public demo — under two minutes</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#1a1413]/60">
            Press play to watch an agent get created, authenticated, scoped, called, and audited — all live against the
            console.
          </p>
          <button className={`${primaryBtn} mt-6`} onClick={start}>
            Play demo
          </button>
        </Card>
      ) : (
        <Card className="p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#9a0002]">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">{steps[step].label}</h2>
          <p className="mt-2 text-sm text-[#1a1413]/65">{steps[step].caption}</p>
          <div className="mt-5">{steps[step].render(db)}</div>
          {step === steps.length - 1 && (
            <p className="mt-5 font-display text-lg">
              Account to verified, auditable agent — in under two minutes.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

function Agents({ db, refresh, onSelect }: { db: DB; refresh: () => Promise<void>; onSelect: (id: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState<"development" | "production">("development");
  const [caps, setCaps] = useState<Capability[]>(["Email"]);
  const [justCreated, setJustCreated] = useState<Agent | null>(null);

  const toggleCap = (c: Capability) =>
    setCaps((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const { agent } = await repo.createAgent({
        name: name.trim(),
        description: description.trim(),
        environment,
        capabilities: caps,
      });
      await refresh();
      setJustCreated(agent);
      toast("Agent created");
      setName("");
      setDescription("");
      setEnvironment("development");
      setCaps(["Email"]);
      setCreating(false);
    } catch {
      toast("Could not create agent", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionTitle
        title="Agents"
        sub="Create, manage, and authenticate AI agents."
        action={
          <button className={primaryBtn} onClick={() => setCreating((v) => !v)}>
            {creating ? "Cancel" : "+ New Agent"}
          </button>
        }
      />

      {creating && (
        <Card className="mb-6 p-6">
          <h2 className="font-display text-lg font-semibold">Create Agent</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Agent Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Support Agent"
                className="mt-2 w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-2 text-sm outline-none focus:border-[#9a0002]"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this agent do?"
                className="mt-2 min-h-20 w-full resize-none rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-2 text-sm outline-none focus:border-[#9a0002]"
              />
            </label>

            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Capabilities</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_CAPABILITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCap(c)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      caps.includes(c)
                        ? "border-[#9a0002] bg-[#9a0002] text-[#efe6de]"
                        : "border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Environment</span>
              <div className="mt-2 flex gap-2">
                {(["development", "production"] as const).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={`rounded-md border px-4 py-1.5 text-sm capitalize transition-colors ${
                      environment === env
                        ? "border-[#9a0002] bg-[#9a0002] text-[#efe6de]"
                        : "border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className={`${primaryBtn} mt-5`} onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create Agent"}
          </button>
        </Card>
      )}

      {justCreated && (
        <Card className="mb-6 border-[#9a0002]/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Generated Identity</h2>
            <button onClick={() => setJustCreated(null)} className="text-sm text-[#1a1413]/50 hover:text-[#9a0002]">
              Dismiss
            </button>
          </div>
          <p className="mt-1 text-sm text-[#1a1413]/60">
            Machinarc automatically generated this identity. The secret key is shown only once.
          </p>
          <dl className="mt-5 divide-y divide-[#1a1413]/10">
            <CopyRow label="Agent ID" value={justCreated.id} />
            <CopyRow label="Public Key" value={justCreated.publicKey} />
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Secret Key</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate font-mono text-xs text-[#9a0002]">{justCreated.secretKey}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(justCreated.secretKey)}
                  className="shrink-0 text-[11px] text-[#9a0002] hover:underline"
                >
                  Copy
                </button>
              </dd>
            </div>
            <CopyRow label="Fingerprint" value={justCreated.fingerprint} />
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Status</dt>
              <dd className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1a7a31]" />
                Healthy
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Created At</dt>
              <dd className="font-mono text-xs">{new Date(justCreated.createdAt).toISOString().slice(0, 10)}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-lg border border-[#9a0002]/20 bg-[#9a0002]/5 px-4 py-3 text-xs text-[#9a0002]">
            Save the secret key now — it will not be shown again.
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {db.agents.map((a) => (
          <div key={a.id} className="rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-6">
            <div className="flex items-center justify-between">
              <button onClick={() => onSelect(a.id)} className="text-left font-display text-xl font-semibold hover:text-[#9a0002]">
                {a.name}
              </button>
              <span className="flex items-center gap-2 text-xs text-[#1a1413]/60">
                <span className={`h-2.5 w-2.5 rounded-full ${statusColor(a.status)}`} />
                {a.status === "active" ? "Healthy" : a.status === "paused" ? "Paused" : "Revoked"}
              </span>
            </div>
            <p className="mt-3 font-mono text-xs text-[#1a1413]/50">ID {a.id}</p>
            <p className="mt-1 text-xs text-[#1a1413]/45">Created {relativeTime(a.createdAt)}</p>
            <p className="mt-1 font-mono text-xs text-[#1a1413]/40">FP {a.fingerprint}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {a.capabilities.map((c) => (
                <span key={c} className="rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-2.5 py-1 text-xs">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button className="text-sm text-[#9a0002] hover:underline" onClick={() => onSelect(a.id)}>
                Manage
              </button>
              <button
                className="text-sm text-[#1a1413]/50 hover:text-[#9a0002]"
                onClick={() => {
                  if (confirm(`Revoke ${a.name}?`)) {
                    repo
                      .deleteAgent(a.id)
                      .then(refresh)
                      .then(() => toast("Agent revoked"))
                      .catch(() => toast("Could not revoke agent", "error"));
                  }
                }}
              >
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-[#1a1413]/60">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span className="truncate font-mono text-xs">{value}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            toast("Copied to clipboard");
            setTimeout(() => setCopied(false), 1200);
          }}
          className="shrink-0 text-[11px] text-[#9a0002] hover:underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </dd>
    </div>
  );
}

function AgentDetail({ db, agent, refresh, onBack }: { db: DB; agent: Agent; refresh: () => Promise<void>; onBack: () => void }) {
  const agentLogs = db.logs.filter((l) => l.agent === agent.name);

  const toggleStatus = async () => {
    try {
      await repo.updateAgentStatus(agent.id, agent.status === "active" ? "paused" : "active");
      await refresh();
    } catch {
      toast("Could not update agent", "error");
    }
  };

  const rotate = async () => {
    try {
      await repo.rotateAgentKeys(agent.id);
      await refresh();
      toast("Agent keys rotated");
    } catch {
      toast("Could not rotate keys", "error");
    }
  };

  const remove = async () => {
    if (!confirm(`Delete ${agent.name}? This cannot be undone.`)) return;
    try {
      await repo.deleteAgent(agent.id);
      await refresh();
      toast("Agent deleted");
      onBack();
    } catch {
      toast("Could not delete agent", "error");
    }
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-[#9a0002] hover:underline">
        ← Back to agents
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${statusColor(agent.status)}`} />
          <h1 className="font-display text-3xl font-semibold tracking-tight">{agent.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={ghostBtn} onClick={toggleStatus}>
            {agent.status === "active" ? "Pause" : "Resume"}
          </button>
          <button className={ghostBtn} onClick={rotate}>
            Rotate keys
          </button>
          <button className={ghostBtn} onClick={remove}>
            Revoke
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Identity</h2>
          <p className="mb-2 text-xs text-[#1a1413]/50">Like a GitHub account, for an AI.</p>
          <dl className="divide-y divide-[#1a1413]/10">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Agent Name</dt>
              <dd className="text-sm font-medium">{agent.name}</dd>
            </div>
            <CopyRow label="Agent ID" value={agent.id} />
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Status</dt>
              <dd className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${statusColor(agent.status)}`} />
                {agent.status === "active" ? "Healthy" : agent.status === "paused" ? "Paused" : "Revoked"}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Environment</dt>
              <dd className="text-sm capitalize">{agent.environment}</dd>
            </div>
            <CopyRow label="Public Key" value={agent.publicKey} />
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Created Date</dt>
              <dd className="font-mono text-xs">{new Date(agent.createdAt).toISOString()}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-[#1a1413]/60">Last Activity</dt>
              <dd className="text-sm">{relativeTime(agent.lastActivity)}</dd>
            </div>
          </dl>

          {agent.description ? <p className="mt-4 text-sm text-[#1a1413]/65">{agent.description}</p> : null}

          <div className="mt-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1a1413]/45">Capabilities</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.capabilities.length === 0 ? (
                <span className="text-sm text-[#1a1413]/45">None</span>
              ) : (
                agent.capabilities.map((c) => (
                  <span key={c} className="rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-2.5 py-1 text-xs">
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#1a1413]/10 bg-[#efe6de] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1a1413]/45">API Credentials</p>
            <dl className="mt-2 divide-y divide-[#1a1413]/10">
              <CopyRow label="Secret Key" value={agent.secretKey} />
              <CopyRow label="Fingerprint" value={agent.fingerprint} />
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-sm text-[#1a1413]/60">Verify</dt>
                <dd className="font-mono text-xs">POST /v1/verify</dd>
              </div>
            </dl>
          </div>

          <button
            className="mt-5 w-full rounded-md border border-[#9a0002] px-4 py-2 text-sm font-medium text-[#9a0002] transition-colors hover:bg-[#9a0002] hover:text-[#efe6de]"
            onClick={remove}
          >
            Delete Agent
          </button>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-1 font-display text-lg font-semibold">Policies</h2>
            <p className="mb-4 text-xs text-[#1a1413]/50">Agent → Policies → Permissions</p>
            <div className="space-y-5">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.resource}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#9a0002]">{group.resource}</p>
                  <ul className="mt-2 space-y-2.5">
                    {group.permissions.map((perm) => {
                      const allowed = agent.policies[perm.key] ?? false;
                      return (
                        <li key={perm.key} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm">
                            <span className={allowed ? "" : "text-[#1a1413]/50"}>{perm.label}</span>
                            {perm.sensitive ? (
                              <span className="rounded-full bg-[#9a0002]/10 px-2 py-0.5 text-[10px] font-medium text-[#9a0002]">
                                sensitive
                              </span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              repo.setPolicy(agent.id, perm.key, !allowed).then(refresh).catch(() => toast("Could not update policy", "error"));
                            }}
                            className={`relative h-6 w-11 rounded-full transition-colors ${allowed ? "bg-[#1a7a31]" : "bg-[#1a1413]/20"}`}
                            aria-label={`Toggle ${perm.label}`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#efe6de] transition-all ${allowed ? "left-[22px]" : "left-0.5"}`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Logs</h2>
            <div className="space-y-2">
              {agentLogs.length === 0 ? (
                <p className="text-sm text-[#1a1413]/50">No activity yet.</p>
              ) : (
                agentLogs.slice(0, 8).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-mono text-xs text-[#1a1413]/50">{clockTime(l.time)}</span>
                    <span className="flex-1 truncate px-2 text-[#1a1413]/80">{l.action}</span>
                    <span className="font-mono text-xs text-[#1a1413]/45">{l.latencyMs}ms</span>
                    <span className={`font-mono text-xs ${l.result === "Blocked" ? "text-[#9a0002]" : "text-[#1a7a31]"}`}>
                      {l.result}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ApiKeys({ db, refresh }: { db: DB; refresh: () => Promise<void> }) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<"development" | "production">("development");
  const [permissions, setPermissions] = useState<"full" | "read" | "custom">("full");
  const [reveal, setReveal] = useState<{ name: string; token: string } | null>(null);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const { key } = await repo.createKey({ name: name.trim(), environment, permissions });
      await refresh();
      setReveal({ name: key.name, token: key.token });
      toast("API key created");
      setName("");
      setEnvironment("development");
      setPermissions("full");
      setCreating(false);
    } catch {
      toast("Could not create API key", "error");
    } finally {
      setBusy(false);
    }
  };

  const permLabel = (p: "full" | "read" | "custom") => (p === "full" ? "Full Access" : p === "read" ? "Read Only" : "Custom");

  return (
    <div>
      <SectionTitle
        title="API Keys"
        sub="Bearer tokens authenticate developers and agents against the Machinarc API."
        action={
          <button className={primaryBtn} onClick={() => setCreating((v) => !v)}>
            {creating ? "Cancel" : "+ Create API Key"}
          </button>
        }
      />

      {creating && (
        <Card className="mb-6 p-6">
          <h2 className="font-display text-lg font-semibold">Create API Key</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Key Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production Key"
                className="mt-2 w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-2 text-sm outline-none focus:border-[#9a0002]"
              />
            </label>

            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Environment</span>
              <div className="mt-2 flex gap-2">
                {(["development", "production"] as const).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={`rounded-md border px-4 py-1.5 text-sm capitalize transition-colors ${
                      environment === env
                        ? "border-[#9a0002] bg-[#9a0002] text-[#efe6de]"
                        : "border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Permissions</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["full", "read", "custom"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPermissions(p)}
                    className={`rounded-md border px-4 py-1.5 text-sm transition-colors ${
                      permissions === p
                        ? "border-[#9a0002] bg-[#9a0002] text-[#efe6de]"
                        : "border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
                    }`}
                  >
                    {permLabel(p)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className={`${primaryBtn} mt-5`} onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create API Key"}
          </button>
        </Card>
      )}

      {reveal && (
        <Card className="mb-6 border-[#9a0002]/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{reveal.name} — secret shown once</h2>
            <button onClick={() => setReveal(null)} className="text-sm text-[#1a1413]/50 hover:text-[#9a0002]">
              Dismiss
            </button>
          </div>
          <p className="mt-1 text-sm text-[#1a1413]/60">Copy this secret now. It will not be shown again.</p>
          <div className="mt-4 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-[#1a1413]/15 bg-[#1a1413] px-4 py-3 font-mono text-xs text-[#efe6de]">
              {reveal.token}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(reveal.token)}
              className={primaryBtn}
            >
              Copy
            </button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {db.apiKeys.map((k) => (
          <Card key={k.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-semibold">{k.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${
                    k.environment === "production" ? "bg-[#9a0002]/12 text-[#9a0002]" : "bg-[#1a1413]/10 text-[#1a1413]/60"
                  }`}
                >
                  {k.environment}
                </span>
                <span className="rounded-full bg-[#1a1413]/8 px-2 py-0.5 text-[10px] text-[#1a1413]/55">
                  {permLabel(k.permissions)}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-[#1a1413]/50">{k.keyPrefix}_••••••••••••</p>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs text-[#1a1413]/60">
              <span>Created {relativeTime(k.createdAt)}</span>
              <span>Used {relativeTime(k.lastUsedAt)}</span>
              <button
                className="text-[#1a1413]/70 hover:text-[#9a0002]"
                onClick={() => {
                  repo
                    .rotateKey(k.id)
                    .then(async ({ key }) => {
                      await refresh();
                      if (key) setReveal({ name: key.name, token: key.token });
                      toast("API key rotated");
                    })
                    .catch(() => toast("Could not rotate key", "error"));
                }}
              >
                Rotate
              </button>
              <button
                className="text-[#9a0002] hover:underline"
                onClick={() => {
                  if (confirm(`Revoke ${k.name}? This is immediate.`)) {
                    repo
                      .revokeKey(k.id)
                      .then(refresh)
                      .then(() => toast("API key revoked"))
                      .catch(() => toast("Could not revoke key", "error"));
                  }
                }}
              >
                Revoke
              </button>
            </div>
          </Card>
        ))}
        {db.apiKeys.length === 0 && <p className="text-sm text-[#1a1413]/50">No API keys yet.</p>}
      </div>
    </div>
  );
}

function Policies({ db, refresh }: { db: DB; refresh: () => Promise<void> }) {
  const [agentId, setAgentId] = useState(db.agents[0]?.id ?? "");
  const agent = db.agents.find((a) => a.id === agentId) ?? db.agents[0];

  if (!agent) return <p className="text-sm text-[#1a1413]/50">Create an agent first.</p>;

  return (
    <div>
      <SectionTitle
        title="Policies"
        sub="Agent → Policies → Permissions. Every permission is an object you grant or deny."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {db.agents.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAgentId(a.id)}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              agent.id === a.id ? "bg-[#9a0002] text-[#efe6de]" : "border border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {PERMISSION_GROUPS.map((group) => {
          const granted = group.permissions.filter((p) => agent.policies[p.key]).length;
          return (
            <Card key={group.resource} className="p-6">
              <div className="mb-4 flex items-center justify-between border-b border-[#1a1413]/10 pb-3">
                <h2 className="font-display text-lg font-semibold">{group.resource}</h2>
                <span className="font-mono text-xs text-[#1a1413]/50">
                  {granted}/{group.permissions.length} granted
                </span>
              </div>
              <ul className="divide-y divide-[#1a1413]/10">
                {group.permissions.map((perm) => {
                  const allowed = agent.policies[perm.key] ?? false;
                  return (
                    <li key={perm.key} className="flex items-center justify-between py-3.5">
                      <span className="flex items-center gap-2 text-sm">
                        <span className={allowed ? "" : "text-[#1a1413]/50"}>{perm.label}</span>
                        <span className="font-mono text-[11px] text-[#1a1413]/35">{perm.key}</span>
                        {perm.sensitive ? (
                          <span className="rounded-full bg-[#9a0002]/10 px-2 py-0.5 text-[10px] font-medium text-[#9a0002]">
                            sensitive
                          </span>
                        ) : null}
                      </span>
                      <span className="flex items-center gap-3 text-xs text-[#1a1413]/60">
                        {allowed ? "Allowed" : "Denied"}
                        <button
                          type="button"
                          onClick={() => {
                            repo.setPolicy(agent.id, perm.key, !allowed).then(refresh).catch(() => toast("Could not update policy", "error"));
                          }}
                          className={`relative h-6 w-11 rounded-full transition-colors ${allowed ? "bg-[#1a7a31]" : "bg-[#1a1413]/20"}`}
                          aria-label={`Toggle ${perm.label}`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#efe6de] transition-all ${allowed ? "left-[22px]" : "left-0.5"}`}
                          />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Verify({ db, refresh }: { db: DB; refresh: () => Promise<void> }) {
  const [agentId, setAgentId] = useState(db.agents[0]?.id ?? "");
  const [token, setToken] = useState("");
  const [requirePerm, setRequirePerm] = useState("");
  const [output, setOutput] = useState<string>("// Verification result appears here");

  const run = async () => {
    try {
      const { result } = await repo.verify({
        agentId: agentId.trim(),
        token: token.trim() || undefined,
        require: requirePerm.trim() || undefined,
      });
      setOutput(JSON.stringify(result, null, 2));
      await refresh();
    } catch {
      toast("Verification request failed", "error");
    }
  };

  const errorCodes: [string, string][] = [
    ["INVALID_TOKEN", "API token is invalid"],
    ["TOKEN_REVOKED", "API token has been revoked"],
    ["AGENT_NOT_FOUND", "Agent does not exist"],
    ["AGENT_DISABLED", "Agent is inactive"],
    ["PERMISSION_DENIED", "Required permission is missing"],
    ["WORKSPACE_DISABLED", "Workspace is inactive"],
  ];

  return (
    <div>
      <SectionTitle
        title="Verify"
        sub="The trust layer — confirm an agent is legitimate, active, and authorized before granting access."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">POST /v1/verify</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Agent</span>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="mt-2 w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-2 text-sm outline-none focus:border-[#9a0002]"
              >
                {db.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
                <option value="ag_doesnotexist">Unknown agent (test failure)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Token (optional)</span>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="sk_live_... or mk_live_..."
                className="mt-2 w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-2 font-mono text-xs outline-none focus:border-[#9a0002]"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Require permission (optional)</span>
              <input
                value={requirePerm}
                onChange={(e) => setRequirePerm(e.target.value)}
                placeholder="email.send"
                className="mt-2 w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-2 font-mono text-xs outline-none focus:border-[#9a0002]"
              />
            </label>

            <button className={primaryBtn} onClick={run}>
              Verify agent
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Result</p>
            <div className="mt-3">
              <Mono>{output}</Mono>
            </div>
          </Card>

          <Card className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Error codes</p>
            <dl className="mt-3 divide-y divide-[#1a1413]/10 text-sm">
              {errorCodes.map(([code, desc]) => (
                <div key={code} className="flex items-center justify-between gap-4 py-2">
                  <dt className="font-mono text-xs text-[#9a0002]">{code}</dt>
                  <dd className="text-right text-[#1a1413]/65">{desc}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AuditLogs({ db, refresh }: { db: DB; refresh: () => Promise<void> }) {
  const [filter, setFilter] = useState<"all" | "Success" | "Blocked">("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"all" | "1h" | "24h">("all");
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const agentNames = useMemo(() => Array.from(new Set(db.logs.map((l) => l.agent))), [db.logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const cutoff = range === "1h" ? now - 3600000 : range === "24h" ? now - 86400000 : 0;
    return db.logs.filter((l) => {
      if (filter !== "all" && l.result !== filter) return false;
      if (agentFilter !== "all" && l.agent !== agentFilter) return false;
      if (cutoff && l.time < cutoff) return false;
      if (q) {
        const hay = `${l.agent} ${l.action} ${l.resource} ${l.requestId} ${l.ip}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [db.logs, filter, agentFilter, search, range]);

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionTitle
        title="Audit Logs"
        sub="An immutable history of every action across the platform — searchable and exportable."
        action={
          <div className="flex gap-2">
            <button className={ghostBtn} onClick={() => download(exportLogsCsv(filtered), "audit-logs.csv", "text/csv")}>
              Export CSV
            </button>
            <button className={ghostBtn} onClick={() => download(exportLogsJson(filtered), "audit-logs.json", "application/json")}>
              Export JSON
            </button>
          </div>
        }
      />

      {/* Search + filters */}
      <div className="mb-4 space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agent, action, resource, request ID, IP..."
          className="w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-4 py-2.5 text-sm outline-none focus:border-[#9a0002]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-1.5 text-sm outline-none focus:border-[#9a0002]"
          >
            <option value="all">All agents</option>
            {agentNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {(["all", "Success", "Blocked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                filter === f ? "bg-[#9a0002] text-[#efe6de]" : "border border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
              }`}
            >
              {f === "all" ? "Any status" : f}
            </button>
          ))}
          {(["all", "1h", "24h"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                range === r ? "bg-[#9a0002] text-[#efe6de]" : "border border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
              }`}
            >
              {r === "all" ? "All time" : `Last ${r}`}
            </button>
          ))}
          <button
            className="ml-auto text-sm text-[#1a1413]/55 hover:text-[#9a0002]"
            onClick={() => {
              if (confirm("Clear all logs?")) {
                repo.clearLogs().then(refresh).catch(() => toast("Could not clear logs", "error"));
              }
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-[#1a1413]/50">{filtered.length} events</p>

      <Card className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[64px_1.1fr_1.3fr_92px_64px_70px_1fr] gap-3 border-b border-[#1a1413]/10 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#1a1413]/50">
            <span>Time</span>
            <span>Agent</span>
            <span>Action</span>
            <span>Status</span>
            <span className="text-right">Code</span>
            <span className="text-right">Latency</span>
            <span>Request ID</span>
          </div>
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[#1a1413]/50">No matching events.</p>
          ) : (
            filtered.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelected(l)}
                className="grid w-full grid-cols-[64px_1.1fr_1.3fr_92px_64px_70px_1fr] items-center gap-3 border-b border-[#1a1413]/10 px-5 py-3.5 text-left text-sm last:border-b-0 hover:bg-[#1a1413]/[0.03]"
              >
                <span className="font-mono text-xs text-[#1a1413]/60">{clockTime(l.time)}</span>
                <span className="truncate">{l.agent}</span>
                <span className="truncate text-[#1a1413]/80">{l.action}</span>
                <span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${
                      l.result === "Blocked" ? "bg-[#9a0002]/12 text-[#9a0002]" : "bg-[#1a7a31]/12 text-[#1a7a31]"
                    }`}
                  >
                    {l.result}
                  </span>
                </span>
                <span className="text-right font-mono text-xs text-[#1a1413]/55">{l.responseCode}</span>
                <span className="text-right font-mono text-xs text-[#1a1413]/70">{l.latencyMs}ms</span>
                <span className="truncate font-mono text-xs text-[#1a1413]/45">{l.requestId}</span>
              </button>
            ))
          )}
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a1413]/40 p-4 sm:items-center" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Audit Event</h2>
              <button onClick={() => setSelected(null)} className="text-sm text-[#1a1413]/50 hover:text-[#9a0002]">
                Close
              </button>
            </div>
            <dl className="mt-4 divide-y divide-[#1a1413]/10 text-sm">
              {[
                ["Event ID", selected.id],
                ["Timestamp", new Date(selected.time).toISOString()],
                ["Workspace ID", selected.workspaceId],
                ["Agent ID", selected.agentId ?? "—"],
                ["Agent Name", selected.agent],
                ["API Key ID", selected.apiKeyId ?? "—"],
                ["Action", selected.action],
                ["Resource", selected.resource],
                ["Status", selected.result],
                ["Response Code", String(selected.responseCode)],
                ["Latency", `${selected.latencyMs} ms`],
                ["IP Address", selected.ip],
                ["User Agent", selected.userAgent],
                ["Request ID", selected.requestId],
                ...(selected.reason ? [["Reason", selected.reason] as [string, string]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 py-2">
                  <dt className="text-[#1a1413]/55">{k}</dt>
                  <dd className="max-w-[60%] break-words text-right font-mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function ApiPlayground({ db, commit }: { db: DB; commit: (db: DB) => void }) {
  const methods = ["POST", "GET", "PATCH", "DELETE", "VERIFY"] as const;
  type M = (typeof methods)[number];
  const [method, setMethod] = useState<M>("POST");
  const [body, setBody] = useState('{\n  "name": "Support Agent",\n  "model": "gpt-5"\n}');
  const [targetId, setTargetId] = useState(db.agents[0]?.id ?? "");
  const [response, setResponse] = useState<string>("// Response appears here");

  const run = () => {
    try {
      if (method === "POST") {
        const input = JSON.parse(body) as { name?: string; model?: string };
        if (!input.name) throw new Error("name is required");
        const { db: next, agent } = createAgent(db, { name: input.name, model: input.model });
        commit(next);
        setResponse(JSON.stringify(toPublic(agent), null, 2));
        return;
      }
      if (method === "GET") {
        setResponse(JSON.stringify(db.agents.map(toPublic), null, 2));
        return;
      }
      if (method === "PATCH") {
        const patch = JSON.parse(body) as Partial<{ name: string; status: Agent["status"] }>;
        const exists = db.agents.find((a) => a.id === targetId);
        if (!exists) throw new Error("agent not found");
        const next = { ...db, agents: db.agents.map((a) => (a.id === targetId ? { ...a, ...patch } : a)) };
        commit(next);
        const updated = next.agents.find((a) => a.id === targetId)!;
        setResponse(JSON.stringify(toPublic(updated), null, 2));
        return;
      }
      if (method === "DELETE") {
        const exists = db.agents.find((a) => a.id === targetId);
        if (!exists) throw new Error("agent not found");
        commit(deleteAgent(db, targetId));
        setResponse(JSON.stringify({ id: targetId, deleted: true }, null, 2));
        return;
      }
      // VERIFY
      const result = verifyAgent(db, targetId);
      setResponse(JSON.stringify(result, null, 2));
    } catch (e) {
      setResponse(JSON.stringify({ error: (e as Error).message }, null, 2));
    }
  };

  const path =
    method === "VERIFY" ? "/v1/verify" : method === "GET" ? "/v1/agents" : method === "POST" ? "/v1/agents" : `/v1/agents/${targetId || ":id"}`;

  return (
    <div>
      <SectionTitle title="API Playground" sub="Run the agent API live. These calls mutate your workspace." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                  method === m ? "bg-[#9a0002] text-[#efe6de]" : "border border-[#1a1413]/15 text-[#1a1413]/70 hover:border-[#9a0002]"
                }`}
              >
                {m === "VERIFY" ? "POST /verify" : m}
              </button>
            ))}
          </div>

          <p className="mt-4 font-mono text-xs text-[#1a1413]/60">
            {method === "VERIFY" ? "POST" : method} {path}
          </p>

          {(method === "PATCH" || method === "DELETE" || method === "VERIFY") && (
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">
                {method === "VERIFY" ? "Agent id / key / fingerprint" : "Agent id"}
              </span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="mt-2 w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-3 py-2 text-sm outline-none focus:border-[#9a0002]"
              >
                {db.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </label>
          )}

          {(method === "POST" || method === "PATCH") && (
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Request body</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
                className="mt-2 min-h-32 w-full resize-none rounded-md border border-[#1a1413]/15 bg-[#efe6de] p-3 font-mono text-xs leading-6 outline-none focus:border-[#9a0002]"
              />
            </label>
          )}

          <button className={`${primaryBtn} mt-5`} onClick={run}>
            Send request
          </button>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1a1413]/50">Response</p>
          <div className="mt-3">
            <Mono>{response}</Mono>
          </div>
        </Card>
      </div>
    </div>
  );
}

const SDK_SNIPPETS: { label: string; code: string }[] = [
  {
    label: "Initialize Client",
    code: `import { Machinarc } from "@machinarc/sdk";

const client = new Machinarc({
  apiKey: process.env.MACHINARC_API_KEY,
});`,
  },
  {
    label: "Create Agent",
    code: `const agent = await client.agents.create({
  name: "Support Agent",
  description: "Customer support assistant",
  capabilities: ["email.read", "email.send"],
});`,
  },
  {
    label: "List Agents",
    code: `const agents = await client.agents.list();`,
  },
  {
    label: "Retrieve Agent",
    code: `const agent = await client.agents.retrieve("ag_01HJ8F92");`,
  },
  {
    label: "Update Agent",
    code: `await client.agents.update("ag_01HJ8F92", {
  name: "Sales Agent",
});`,
  },
  {
    label: "Delete Agent",
    code: `await client.agents.delete("ag_01HJ8F92");`,
  },
  {
    label: "Verification",
    code: `const result = await client.verify({
  agentId: "ag_01HJ8F92",
  token: process.env.MACHINARC_SECRET_KEY,
});

if (result.verified) {
  console.log("Agent verified");
}`,
  },
  {
    label: "API Key Management",
    code: `await client.apiKeys.create({ name: "Production" });

await client.apiKeys.rotate(keyId);

await client.apiKeys.revoke(keyId);`,
  },
  {
    label: "Audit Logs",
    code: `const logs = await client.auditLogs.list({
  agentId: "ag_01HJ8F92",
  limit: 50,
});`,
  },
  {
    label: "Error Handling",
    code: `try {
  await client.agents.create({ name: "Support Agent" });
} catch (error) {
  console.error(error.message);
}`,
  },
];

function Sdk() {
  return (
    <div>
      <SectionTitle
        title="SDK"
        sub="The official SDK abstracts raw HTTP into a clean interface for Agents, API Keys, Permissions, and Verification."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">TypeScript</h2>
            <span className="rounded-full bg-[#1a7a31]/12 px-2.5 py-0.5 text-[11px] font-medium text-[#1a7a31]">Available</span>
          </div>
          <p className="mt-2 text-sm text-[#1a1413]/60">Node.js · Next.js · Bun · Deno · Cloudflare Workers</p>
          <div className="mt-4">
            <Mono>npm install @machinarc/sdk</Mono>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Future SDKs</h2>
            <span className="rounded-full bg-[#1a1413]/8 px-2.5 py-0.5 text-[11px] font-medium text-[#1a1413]/55">Planned</span>
          </div>
          <p className="mt-2 text-sm text-[#1a1413]/60">Python · Go · Rust · Java · C#</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Python", "Go", "Rust", "Java", "C#"].map((l) => (
              <span key={l} className="rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-2.5 py-1 text-xs">
                {l}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 space-y-5">
        {SDK_SNIPPETS.map((s) => (
          <div key={s.label}>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#9a0002]">{s.label}</p>
            <Mono>{s.code}</Mono>
          </div>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="font-display text-lg font-semibold">Package structure</h2>
        <div className="mt-4">
          <Mono>{`sdk-typescript/
├── src/
├── examples/
├── docs/
├── tests/
├── package.json
├── tsconfig.json
└── README.md`}</Mono>
        </div>
      </Card>
    </div>
  );
}

const DOC_SECTIONS = [
  "Quick Start",
  "Authentication",
  "Agents",
  "Permissions",
  "Audit Logs",
  "SDK",
  "Examples",
  "API Reference",
  "Tech Stack",
] as const;

const TECH_STACK: { group: string; items: string[] }[] = [
  { group: "Frontend", items: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "shadcn/ui", "Radix UI", "Lucide Icons"] },
  { group: "State", items: ["TanStack Query", "Zustand"] },
  { group: "Backend", items: ["FastAPI", "Python 3.13+"] },
  { group: "Auth", items: ["JWT", "API Keys", "OAuth 2.0 (future)"] },
  { group: "ORM", items: ["SQLAlchemy 2.0", "Alembic"] },
  { group: "Database", items: ["PostgreSQL", "Redis"] },
  { group: "API", items: ["REST", "OpenAPI", "JSON", "GraphQL (future)", "gRPC (future)"] },
  { group: "SDKs", items: ["TypeScript", "Python (planned)", "Go (planned)", "Rust (planned)"] },
  { group: "Infrastructure", items: ["Vercel", "Railway", "Fly.io", "Kubernetes (future)", "AWS ECS (future)"] },
  { group: "Storage", items: ["Cloudflare R2", "AWS S3 (alt)"] },
  { group: "Monitoring", items: ["Sentry", "Better Stack", "OpenTelemetry (future)"] },
  { group: "CI/CD", items: ["GitHub Actions", "Lint", "Test", "Build", "Deploy"] },
  { group: "Security", items: ["HTTPS", "Rate Limiting", "CORS", "Secret Hashing", "API Key Rotation", "mTLS (future)"] },
  { group: "Dev Tools", items: ["Git", "GitHub", "Docker", "Docker Compose", "Bruno", "VS Code"] },
];

type DocSection = (typeof DOC_SECTIONS)[number];

function DocBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-6">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[#1a1413]/75">{children}</div>
    </section>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#1a1413]/10 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <span className={`w-16 shrink-0 font-mono text-xs font-semibold ${method === "GET" ? "text-[#1a7a31]" : "text-[#9a0002]"}`}>
        {method}
      </span>
      <span className="w-48 shrink-0 font-mono text-sm">{path}</span>
      <span className="text-sm text-[#1a1413]/65">{desc}</span>
    </div>
  );
}

function Docs() {
  const [active, setActive] = useState<DocSection>("Quick Start");

  return (
    <div>
      <SectionTitle title="Documentation" sub="Everything you need to secure autonomous agents." />

      <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="lg:sticky lg:top-6 lg:self-start" aria-label="Docs">
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {DOC_SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  active === s ? "bg-[#9a0002] text-[#efe6de]" : "text-[#1a1413]/70 hover:bg-[#1a1413]/5 hover:text-[#1a1413]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-12">
          {active === "Quick Start" && (
            <DocBlock title="Quick Start">
              <p>Create your first secure agent in under a minute.</p>
              <p className="font-medium text-[#1a1413]">1. Install the SDK</p>
              <Mono>npm install @machinarc/sdk</Mono>
              <p className="font-medium text-[#1a1413]">2. Create and verify an agent</p>
              <Mono>{`import { Machinarc } from "@machinarc/sdk";

const machinarc = new Machinarc(process.env.MACHINARC_KEY);

const agent = await machinarc.createAgent({ name: "Support Agent" });
await agent.verify();

await agent.execute({ action: "send_email", to: "customer@acme.com" });`}</Mono>
              <p className="font-medium text-[#1a1413]">3. That's it</p>
              <p>Your agent now has an identity, a key pair, permissions, and a full audit trail.</p>
            </DocBlock>
          )}

          {active === "Authentication" && (
            <DocBlock title="Authentication">
              <p>Authenticate every request with an API key sent as a bearer token. The console issues a JWT per session.</p>
              <Mono>{`curl https://api.machinarc.com/v1/agents \\
  -H "Authorization: Bearer sk_live_..."`}</Mono>
              <p>Keys can be created, rotated, and revoked from the API Keys tab. Rotate keys regularly and never commit them to source control.</p>
              <Card className="p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#9a0002]">Key types</p>
                <ul className="mt-2 space-y-1 text-sm text-[#1a1413]/75">
                  <li>• <span className="font-mono">sk_live_</span> — secret keys for server-side calls</li>
                  <li>• <span className="font-mono">pk_live_</span> — public keys for agent verification</li>
                </ul>
              </Card>
            </DocBlock>
          )}

          {active === "Agents" && (
            <DocBlock title="Agents">
              <p>An agent is an identity for autonomous software. Each one receives a UUID, public/secret key pair, and a fingerprint.</p>
              <Mono>{`const agent = await machinarc.createAgent({
  name: "Support Agent",
  model: "gpt-5",
});

// agent.id          -> "ag_..."
// agent.public_key  -> "pk_live_..."
// agent.fingerprint -> "a1:b2:c3:..."`}</Mono>
              <p>Verify an agent at any time with its id, public key, fingerprint, or UUID.</p>
              <Mono>{`const { verified } = await machinarc.verify(agent.id);
// { verified: true }`}</Mono>
            </DocBlock>
          )}

          {active === "Permissions" && (
            <DocBlock title="Permissions">
              <p>Permissions are objects scoped by resource and action. Grant only what an agent needs — think OAuth for autonomous software.</p>
              <Mono>{`await machinarc.policies.set(agent.id, {
  allow: ["gmail:read", "gmail:send", "calendar:read"],
  deny:  ["gmail:delete", "stripe:transfer"],
});`}</Mono>
              <p>Sensitive actions like <span className="font-mono">gmail:delete</span> and <span className="font-mono">stripe:transfer</span> are denied by default.</p>
            </DocBlock>
          )}

          {active === "Audit Logs" && (
            <DocBlock title="Audit Logs">
              <p>Every request is recorded with time, agent, action, result, latency, IP, and request ID.</p>
              <Mono>{`GET /v1/logs

[
  {
    "request_id": "req_8f3a2b9c",
    "time": "2026-01-01T12:03:00Z",
    "agent": "Support Agent",
    "action": "Send Email",
    "result": "success",
    "latency_ms": 143,
    "ip": "203.0.113.24"
  }
]`}</Mono>
              <p>Logs are immutable and exportable — the audit trail enterprises require.</p>
            </DocBlock>
          )}

          {active === "SDK" && (
            <DocBlock title="SDK">
              <p>The official TypeScript SDK abstracts raw HTTP into a clean client for Agents, API Keys, and Verification.</p>
              <Mono>{`npm install @machinarc/sdk`}</Mono>
              <Mono>{`import { Machinarc } from "@machinarc/sdk";

const client = new Machinarc({
  apiKey: process.env.MACHINARC_API_KEY,
});

const agent = await client.agents.create({
  name: "Support Agent",
  description: "Customer support assistant",
  capabilities: ["email", "calendar"],
});

await client.verify({ agentId: agent.id, token: "..." });

const logs = await client.auditLogs.list({ agentId: agent.id, limit: 50 });`}</Mono>
              <p>Future SDKs are planned for Python, Go, Rust, Java, and C#.</p>
            </DocBlock>
          )}

          {active === "Examples" && (
            <DocBlock title="Examples">
              <p>Common patterns to copy and adapt.</p>
              <p className="font-medium text-[#1a1413]">Support agent with scoped email access</p>
              <Mono>{`const agent = await machinarc.createAgent({ name: "Support" });

await machinarc.policies.set(agent.id, {
  allow: ["gmail:read", "gmail:send"],
  deny:  ["gmail:delete"],
});

await agent.execute({ action: "send_email", to: "customer@acme.com" });`}</Mono>
              <p className="font-medium text-[#1a1413]">Read-only analytics agent</p>
              <Mono>{`const agent = await machinarc.createAgent({ name: "Analytics" });

await machinarc.policies.set(agent.id, {
  allow: ["crm:read"],
  deny:  ["crm:write", "crm:export"],
});`}</Mono>
            </DocBlock>
          )}

          {active === "API Reference" && (
            <DocBlock title="API Reference">
              <p>The full REST surface behind the console.</p>
              <p className="font-medium text-[#1a1413]">Sample response</p>
              <Mono>{`{
  "id": "ag_01HJ8F92",
  "name": "Support Agent",
  "status": "healthy",
  "public_key": "pk_live_xxx",
  "created_at": "2026-06-29T10:20:00Z"
}`}</Mono>
              <div className="overflow-hidden rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8]">
                {(
                  [
                    ["POST", "/v1/agents", "Create an agent."],
                    ["GET", "/v1/agents", "List agents."],
                    ["GET", "/v1/agents/:id", "Retrieve an agent."],
                    ["PATCH", "/v1/agents/:id", "Update an agent."],
                    ["DELETE", "/v1/agents/:id", "Revoke an agent."],
                    ["POST", "/v1/verify", "Verify an agent identity."],
                    ["POST", "/v1/api-keys", "Create an API key."],
                    ["GET", "/v1/api-keys", "List API keys."],
                    ["POST", "/v1/api-keys/:id/rotate", "Rotate an API key."],
                    ["DELETE", "/v1/api-keys/:id", "Revoke an API key."],
                    ["POST", "/v1/policies", "Assign permissions."],
                    ["GET", "/v1/audit-logs", "List audit logs."],
                    ["GET", "/v1/audit-logs/:id", "Retrieve an audit event."],
                    ["GET", "/v1/audit-logs/search", "Search audit logs."],
                  ] as [string, string, string][]
                ).map(([method, path, desc]) => (
                  <Endpoint key={`${method}-${path}`} method={method} path={path} desc={desc} />
                ))}
              </div>
            </DocBlock>
          )}

          {active === "Tech Stack" && (
            <DocBlock title="Tech Stack">
              <p>Machinarc is built on a modern, scalable stack — simple for the MVP, extensible for enterprise scale.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {TECH_STACK.map((g) => (
                  <Card key={g.group} className="p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#9a0002]">{g.group}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {g.items.map((i) => (
                        <span key={i} className="rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-2.5 py-1 text-xs">
                          {i}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <p className="font-medium text-[#1a1413]">Architecture</p>
              <Mono>{`Client (Next.js)
        ↓
REST API (FastAPI)
        ↓
Authentication
        ↓
Business Logic
        ↓
PostgreSQL  →  Redis  →  Storage (Cloudflare R2)`}</Mono>
            </DocBlock>
          )}
        </div>
      </div>
    </div>
  );
}

function Settings({
  session,
  onSession,
  commit,
}: {
  session: Session;
  onSession: (s: Session) => void;
  commit: (db: DB) => void;
}) {
  const [wsName, setWsName] = useState(session.org);
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <SectionTitle title="Settings" sub="Workspace and account configuration." />
      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Workspace</h2>
          <p className="mt-1 text-sm text-[#1a1413]/55">Rename your workspace.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={wsName}
              onChange={(e) => {
                setWsName(e.target.value);
                setSaved(false);
              }}
              className="min-w-0 flex-1 rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-4 py-2.5 text-sm outline-none focus:border-[#9a0002]"
            />
            <button
              className={primaryBtn}
              onClick={() => {
                const next = renameWorkspace(wsName);
                if (next) {
                  onSession(next);
                  setSaved(true);
                  toast("Workspace renamed");
                }
              }}
            >
              Save
            </button>
          </div>
          {saved ? <p className="mt-3 text-sm text-[#1a7a31]">Workspace renamed.</p> : null}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Account</h2>
          <dl className="mt-4 divide-y divide-[#1a1413]/10">
            {[
              ["Workspace", session.org],
              ["Account", session.email],
              ["Plan", "Beta"],
              ["Region", "us-east"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <dt className="text-sm text-[#1a1413]/60">{label}</dt>
                <dd className="truncate text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Danger zone</h2>
          <p className="mt-2 text-sm text-[#1a1413]/60">Reset the demo workspace to its seeded state.</p>
          <button
            className="mt-4 rounded-md border border-[#9a0002] px-4 py-2 text-sm font-medium text-[#9a0002] transition-colors hover:bg-[#9a0002] hover:text-[#efe6de]"
            onClick={() => {
              if (confirm("Reset workspace data?")) {
                localStorage.removeItem("machinarc_db");
                commit(loadDB());
              }
            }}
          >
            Reset workspace
          </button>
        </Card>
      </div>
    </div>
  );
}
