import { useEffect, useRef, useState } from "react";
import { LogoMark } from "./Logo";

// The wedge: scoped permissions that BLOCK dangerous agent actions.
const attempts = [
  { action: "Read support inbox", scope: "email.read", allowed: true },
  { action: "Send reply to customer", scope: "email.send", allowed: true },
  { action: "Delete all emails", scope: "email.delete", allowed: false },
  { action: "Wire $40,000 via Stripe", scope: "payments.transfer", allowed: false },
  { action: "Export customer database", scope: "crm.export", allowed: false },
];

const steps = [
  ["Give the agent an identity", "Every agent gets a verifiable ID and key pair — no shared secrets."],
  ["Scope its permissions", "Grant the exact actions it needs. Everything else is denied by default."],
  ["Machinarc enforces it", "Each request is checked against policy. Unauthorized actions are blocked."],
  ["Audit every decision", "Allowed or blocked, every attempt is recorded with a request ID."],
];

const roadmap = [
  ["Trust scoring", "Speculative"],
  ["Machine-to-machine auth", "Speculative"],
  ["Machine payments", "Speculative"],
  ["Reputation network", "Speculative"],
];

// ---- Demo "video": a scripted, screen-recording-style walkthrough (~50s) ----
type DemoLine = { t: number; text: string; kind: "cmd" | "out" | "allow" | "block" | "title" };

const DEMO_DURATION = 50; // seconds
const DEMO_SCRIPT: DemoLine[] = [
  { t: 1, text: "Create an agent", kind: "title" },
  { t: 2, text: "$ machinarc agents create --name 'Support Agent'", kind: "cmd" },
  { t: 5, text: "✓ agent ag_01HJ8F92 created", kind: "out" },
  { t: 6, text: "  public_key  pk_live_8f3a…", kind: "out" },
  { t: 7, text: "  secret_key  sk_live_•••• (shown once)", kind: "out" },
  { t: 10, text: "Scope its permissions", kind: "title" },
  { t: 11, text: "$ machinarc agents allow ag_01HJ8F92 email.read", kind: "cmd" },
  { t: 13, text: "✓ email.read granted", kind: "allow" },
  { t: 15, text: "$ machinarc agents block ag_01HJ8F92 payments.transfer", kind: "cmd" },
  { t: 17, text: "✓ payments.transfer denied", kind: "block" },
  { t: 21, text: "The agent runs", kind: "title" },
  { t: 22, text: "→ agent attempts: read support inbox", kind: "cmd" },
  { t: 24, text: "200 ALLOW  email.read  ·  142ms", kind: "allow" },
  { t: 27, text: "→ agent attempts: wire $40,000 via Stripe", kind: "cmd" },
  { t: 29, text: "403 BLOCK  payments.transfer  ·  permission denied", kind: "block" },
  { t: 34, text: "Verify before acting", kind: "title" },
  { t: 35, text: "$ machinarc verify ag_01HJ8F92 --require email.read", kind: "cmd" },
  { t: 37, text: "✓ verified · permissions: [email.read]", kind: "allow" },
  { t: 41, text: "Every decision is audited", kind: "title" },
  { t: 42, text: "12:03  Send Email          ALLOW   142ms  req_a91k", kind: "out" },
  { t: 44, text: "12:04  Stripe Transfer     BLOCK    38ms  req_b32m", kind: "out" },
  { t: 46, text: "12:04  Verify              ALLOW    61ms  req_c14p", kind: "out" },
  { t: 48, text: "One bad prompt can't wipe production.", kind: "title" },
];

function lineClass(kind: DemoLine["kind"]): string {
  switch (kind) {
    case "cmd":
      return "text-[#efe6de]";
    case "out":
      return "text-[#efe6de]/55";
    case "allow":
      return "text-emerald-300";
    case "block":
      return "text-[#ff6b6d]";
    case "title":
      return "text-[#ffb38a]";
  }
}

function DemoVideo() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const baseRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUpdate = useRef<number>(0);

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const tick = (now: number) => {
    const e = baseRef.current + (now - startRef.current) / 1000;
    if (e >= DEMO_DURATION) {
      setElapsed(DEMO_DURATION);
      setPlaying(false);
      stop();
      return;
    }
    // throttle React updates to ~10fps — plenty for a terminal demo, smooth on mobile
    if (now - lastUpdate.current >= 100) {
      lastUpdate.current = now;
      setElapsed(e);
    }
    raf.current = requestAnimationFrame(tick);
  };

  const play = () => {
    if (elapsed >= DEMO_DURATION) {
      baseRef.current = 0;
      setElapsed(0);
    } else {
      baseRef.current = elapsed;
    }
    startRef.current = performance.now();
    setPlaying(true);
    setStarted(true);
    raf.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    setPlaying(false);
    stop();
  };

  const replay = () => {
    stop();
    baseRef.current = 0;
    setElapsed(0);
    startRef.current = performance.now();
    setPlaying(true);
    setStarted(true);
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);

  const visible = DEMO_SCRIPT.filter((l) => l.t <= elapsed);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visible.length]);

  const pct = Math.min((elapsed / DEMO_DURATION) * 100, 100);
  const mm = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1a1413]/15 bg-[#0f0e0e] shadow-[0_30px_80px_-40px_rgba(26,20,19,0.7)]">
      {/* window chrome */}
      <div className="flex items-center justify-between border-b border-[#efe6de]/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#9a0002]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#efe6de]/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#efe6de]/30" />
          <span className="ml-3 font-mono text-[11px] text-[#efe6de]/40">machinarc — demo</span>
        </div>
        <span className="font-mono text-[11px] text-[#efe6de]/40">
          {mm(elapsed)} / {mm(DEMO_DURATION)}
        </span>
      </div>

      {/* screen */}
      <div className="relative">
        <div ref={scrollRef} className="h-72 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-7 sm:h-80">
          {visible.map((l, i) => (
            <p key={i} className={`${lineClass(l.kind)} ${l.kind === "title" ? "mt-3 first:mt-0 font-semibold" : ""}`}>
              {l.text}
            </p>
          ))}
          {playing && <span className="inline-block h-4 w-2 translate-y-0.5 bg-[#efe6de]/70 mc-blink" />}
        </div>

        {/* poster / play overlay */}
        {!started && (
          <button
            type="button"
            onClick={play}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f0e0e]/80 backdrop-blur-[2px]"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9a0002] text-[#efe6de] shadow-lg transition-transform hover:scale-105">
              <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-0.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#efe6de]/70">Watch 50s demo</span>
          </button>
        )}
      </div>

      {/* controls + scrubber */}
      <div className="border-t border-[#efe6de]/10 px-4 py-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#efe6de]/10">
          <div className="h-full bg-[#9a0002] transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={playing ? pause : play}
            className="rounded-md bg-[#9a0002] px-3 py-1.5 text-xs font-medium text-[#efe6de] transition-colors hover:bg-[#b32426]"
          >
            {playing ? "Pause" : elapsed >= DEMO_DURATION ? "Replay" : "Play"}
          </button>
          <button
            type="button"
            onClick={replay}
            className="rounded-md border border-[#efe6de]/20 px-3 py-1.5 text-xs font-medium text-[#efe6de]/80 transition-colors hover:border-[#efe6de]/50"
          >
            Restart
          </button>
          <span className="ml-auto hidden font-mono text-[11px] text-[#efe6de]/40 sm:inline">create · scope · block · verify · audit</span>
        </div>
      </div>
    </div>
  );
}

function BlockedConsole() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % attempts.length), 2000);
    return () => clearInterval(t);
  }, []);
  const a = attempts[i];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 opacity-25">
        <div className="mc-spin-slow h-full w-full rounded-full border border-dashed border-[#9a0002]/60" />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#1a1413]/15 bg-[#1a1413] text-[#efe6de] shadow-[0_30px_80px_-40px_rgba(26,20,19,0.7)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#9a0002]/25 to-transparent mc-scan" />

        <div className="flex items-center justify-between border-b border-[#efe6de]/10 px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#efe6de]/45">Support Agent</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#efe6de]/45">policy check</span>
        </div>

        <div className="space-y-4 p-6">
          {attempts.map((row, idx) => {
            const active = idx === i;
            return (
              <div
                key={row.action}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${
                  active
                    ? row.allowed
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-[#9a0002]/50 bg-[#9a0002]/15"
                    : "border-[#efe6de]/8 bg-[#efe6de]/[0.02] opacity-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{row.action}</p>
                  <p className="font-mono text-[11px] text-[#efe6de]/40">{row.scope}</p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                    row.allowed ? "bg-emerald-500/90 text-[#0a140c]" : "bg-[#9a0002] text-[#efe6de]"
                  }`}
                >
                  {row.allowed ? "ALLOW" : "BLOCK"}
                </span>
              </div>
            );
          })}

          <div
            className={`rounded-xl border p-4 font-mono text-xs leading-6 transition-colors ${
              a.allowed ? "border-emerald-400/20" : "border-[#9a0002]/30"
            }`}
          >
            <p className="text-[#efe6de]/45">POST /v1/verify → {a.scope}</p>
            <p className={a.allowed ? "text-emerald-300" : "text-[#ff6b6d]"}>
              {a.allowed ? "200 — permitted" : "403 — blocked: permission denied"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const GITHUB_URL = "https://github.com/machinarc";

export default function Landing({
  onSignUp,
  onSignIn,
  onRoadmap,
  onDocs,
  onTerms,
  onPrivacy,
}: {
  onSignUp: () => void;
  onSignIn: () => void;
  onRoadmap: () => void;
  onDocs: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // Pointer-glow is a desktop nicety; skip on touch devices to save work on mobile.
    if (window.matchMedia?.("(hover: none)").matches) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      el.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen [overflow-x:clip] bg-[#efe6de] text-[#1a1413]">
      <header className="sticky top-0 z-50 border-b border-[#1a1413]/10 bg-[#efe6de]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight">Machinarc</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="#how" className="hidden text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002] sm:inline">
              How it Works
            </a>
            <a href="#demo" className="hidden text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002] sm:inline">
              Demo
            </a>
            <a href="#api" className="hidden text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002] sm:inline">
              API
            </a>
            <button
              type="button"
              onClick={onDocs}
              className="hidden text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002] sm:inline"
            >
              Docs
            </button>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002] sm:inline"
            >
              GitHub
            </a>
            <button
              type="button"
              onClick={onRoadmap}
              className="hidden text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002] sm:inline"
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() =>
                window.location.assign(
                  `/auth/authorize?client_id=demo-client&redirect_uri=${encodeURIComponent(
                    window.location.origin + "/auth/callback"
                  )}&response_type=code&scope=openid%20email&state=demo_state`
                )
              }
              className="text-sm font-medium text-[#1a1413]/70 transition-colors hover:text-[#9a0002]"
            >
              OAuth Consent Test
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="text-sm font-medium text-[#1a1413]/70 transition-colors hover:text-[#9a0002]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onSignUp}
              className="rounded-md bg-[#9a0002] px-4 py-2 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426]"
            >
              Start free
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — the pain, the wedge, the blocked-action proof */}
        <section className="relative overflow-hidden border-b border-[#1a1413]/10">
          <div
            className="pointer-events-none absolute inset-0 mc-grid-drift opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#1a1413 1px, transparent 1px), linear-gradient(90deg, #1a1413 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx,70%) var(--my,20%), rgba(154,0,2,0.10), transparent 60%)",
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#9a0002]/30 bg-[#9a0002]/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.25em] text-[#9a0002]">
                Security for AI agents
              </div>

              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
                Identity and permissions for AI agents.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[#1a1413]/75">
                AI agents inherit every permission your API key has. Machinarc gives each agent its own identity, scoped
                permissions, and audit trail — so one bad prompt can't wipe your production systems.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onSignUp}
                  className="group inline-flex items-center gap-2 rounded-md bg-[#9a0002] px-6 py-3 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426] active:scale-[0.98]"
                >
                  Secure an agent
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
                <a
                  href="#api"
                  className="rounded-md border border-[#1a1413]/20 px-6 py-3 text-sm font-medium text-[#1a1413] transition-colors hover:border-[#9a0002] hover:text-[#9a0002] active:scale-[0.98]"
                >
                  View the API
                </a>
              </div>

              {/* developer trust signals */}
              <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-[#1a1413]/50">
                {["REST API", "TypeScript SDK", "OpenAPI", "Audit Logs"].map((sig, i) => (
                  <span key={sig} className="flex items-center gap-3">
                    {i > 0 && <span className="text-[#9a0002]/50">•</span>}
                    {sig}
                  </span>
                ))}
              </div>
            </div>

            <div className="mc-float">
              <BlockedConsole />
            </div>
          </div>
        </section>

        {/* Code first — show the API immediately */}
        <section id="api" className="border-b border-[#1a1413]/10 bg-[#efe6de]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">Developer-first</p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Scope an agent in three calls.
                </h2>
                <p className="mt-4 max-w-md text-[#1a1413]/70">
                  Create an agent, allow what it needs, block what it doesn't. The dangerous action is denied at the
                  policy layer — before it ever reaches your APIs.
                </p>
                <button onClick={onDocs} className="mt-6 text-sm font-medium text-[#9a0002] hover:underline">
                  Read the docs →
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#1a1413]/15 bg-[#1a1413] shadow-[0_24px_60px_-30px_rgba(26,20,19,0.6)]">
                <div className="flex items-center gap-2 border-b border-[#efe6de]/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#9a0002]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#efe6de]/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#efe6de]/30" />
                  <span className="ml-3 font-mono text-[11px] text-[#efe6de]/40">agent.ts</span>
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-[#efe6de]">
{`import { Machinarc } from "@machinarc/sdk";

const machinarc = new Machinarc({
  apiKey: process.env.MACHINARC_API_KEY,
});

const agent = await machinarc.agents.create({
  name: "Support Agent",
});

await agent.allow("email.read");
await agent.block("payments.transfer");`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Demo video */}
        <section id="demo" className="border-b border-[#1a1413]/10 bg-[#e9ded3]">
          <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
            <div className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">See it in action</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Create, scope, and block — in under a minute.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[#1a1413]/65">
                A 50-second walkthrough: provision an agent, grant one permission, and watch a dangerous action get
                denied — then audited.
              </p>
            </div>
            <div className="mt-10">
              <DemoVideo />
            </div>
          </div>
        </section>

        {/* Proof centerpiece — the blocked action, full width */}
        <section className="relative overflow-hidden bg-[#1a1413] text-[#efe6de]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(#efe6de 1px, transparent 1px), linear-gradient(90deg, #efe6de 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#ff8a8c]">The proof</p>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              The same agent. One request allowed, the next one blocked.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-6 text-left">
                <span className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#0a140c]">
                  ALLOW
                </span>
                <p className="mt-4 font-display text-xl font-semibold">Send a reply to a customer</p>
                <p className="mt-2 font-mono text-xs text-[#efe6de]/55">scope: email.send → 200 OK</p>
                <p className="mt-4 text-sm leading-6 text-[#efe6de]/70">
                  It's in policy, so Machinarc lets it through and records it.
                </p>
              </div>
              <div className="rounded-2xl border border-[#9a0002]/40 bg-[#9a0002]/15 p-6 text-left">
                <span className="rounded-full bg-[#9a0002] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#efe6de]">
                  BLOCK
                </span>
                <p className="mt-4 font-display text-xl font-semibold">Wire $40,000 via Stripe</p>
                <p className="mt-2 font-mono text-xs text-[#efe6de]/55">scope: payments.transfer → 403 denied</p>
                <p className="mt-4 text-sm leading-6 text-[#efe6de]/70">
                  Never granted, so it's blocked before it runs — prompt injection or not.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignUp}
              className="mt-10 rounded-md bg-[#9a0002] px-6 py-3 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426]"
            >
              Try it on your agent
            </button>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-b border-[#1a1413]/10">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">How it works</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Four steps to a contained agent.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(([title, body], i) => (
                <div key={title} className="relative rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-6">
                  <span className="font-mono text-xs text-[#1a1413]/35">0{i + 1}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#1a1413]/70">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's live today — honest, no fake metrics */}
        <section className="border-b border-[#1a1413]/10 bg-[#e9ded3]">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">Available today</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything you need to scope and verify an agent.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Agent Identity", "Unique IDs and key pairs for every agent."],
                ["Permission Policies", "Allow/deny scopes, denied by default."],
                ["Verification API", "Check identity + permission in one call."],
                ["Audit Logs", "Every allow and block, fully traceable."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-[#1a1413]/12 bg-[#efe6de] p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a7a31]/15 text-[11px] font-bold text-[#1a7a31]">
                      ✓
                    </span>
                    <h3 className="font-display text-lg font-semibold">{title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#1a1413]/70">{body}</p>
                </div>
              ))}
            </div>

            {/* speculative roadmap, clearly labeled and de-emphasized */}
            <div className="mt-12 rounded-2xl border border-dashed border-[#1a1413]/20 bg-[#efe6de]/40 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#1a1413]/50">
                  Exploring next — speculative, not committed
                </p>
                <button onClick={onRoadmap} className="text-sm text-[#9a0002] hover:underline">
                  Full roadmap →
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {roadmap.map(([title, tag]) => (
                  <span
                    key={title}
                    className="inline-flex items-center gap-2 rounded-full border border-[#1a1413]/15 bg-[#efe6de] px-3 py-1.5 text-xs text-[#1a1413]/60"
                  >
                    {title}
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#1a1413]/35">{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#efe6de]">
          <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Stop trusting your agents. Start verifying them.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[#1a1413]/65">
              Create a workspace, scope an agent, and watch a dangerous action get blocked — in minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onSignUp}
                className="rounded-md bg-[#9a0002] px-6 py-3 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426] active:scale-[0.98]"
              >
                Start free
              </button>
              <button
                type="button"
                onClick={onSignIn}
                className="rounded-md border border-[#1a1413]/20 px-6 py-3 text-sm font-medium text-[#1a1413] transition-colors hover:border-[#9a0002] hover:text-[#9a0002]"
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1a1413]/10 bg-[#efe6de]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-[#1a1413]/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-7" />
            <p>Machinarc — Identity and permissions for AI agents.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Footer">
            <button onClick={onDocs} className="transition-colors hover:text-[#9a0002]">
              Docs
            </button>
            <button onClick={onRoadmap} className="transition-colors hover:text-[#9a0002]">
              Roadmap
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-[#9a0002]">
              GitHub
            </a>
            <a href="https://x.com/machinarc" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#9a0002]">
              X
            </a>
            <button onClick={onTerms} className="transition-colors hover:text-[#9a0002]">
              Terms
            </button>
            <button onClick={onPrivacy} className="transition-colors hover:text-[#9a0002]">
              Privacy
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
