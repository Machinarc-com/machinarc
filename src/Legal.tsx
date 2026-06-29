import { LogoMark } from "./Logo";

type LegalKind = "terms" | "privacy";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-[#1a1413]">{title}</h2>
      <div className="text-sm leading-7 text-[#1a1413]/70">{children}</div>
    </section>
  );
}

export default function Legal({ kind, onBack }: { kind: LegalKind; onBack: () => void }) {
  const isTerms = kind === "terms";

  return (
    <div className="min-h-screen [overflow-x:clip] bg-[#efe6de] text-[#1a1413]">
      <header className="sticky top-0 z-50 border-b border-[#1a1413]/10 bg-[#efe6de]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={onBack} className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight">Machinarc</span>
          </button>
          <button onClick={onBack} className="text-sm text-[#1a1413]/70 transition-colors hover:text-[#9a0002]">
            Home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#9a0002]">Legal</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {isTerms ? "Terms of Service" : "Privacy Policy"}
        </h1>
        <p className="mt-3 text-sm text-[#1a1413]/55">Last updated: 2026 · This is a beta product; these terms may change.</p>

        <div className="mt-10 space-y-8">
          {isTerms ? (
            <>
              <Section title="Acceptance">
                By accessing or using Machinarc, you agree to these terms. If you are using Machinarc on behalf of an
                organization, you accept these terms for that organization.
              </Section>
              <Section title="The service">
                Machinarc provides identity, permissions, verification, and audit logging for AI agents and autonomous
                software. The service is offered on an as-is basis during beta and may change at any time.
              </Section>
              <Section title="Accounts & workspaces">
                You are responsible for activity under your account and workspace, including keeping API keys and secret
                keys confidential. Notify us promptly of any unauthorized use.
              </Section>
              <Section title="Acceptable use">
                You agree not to misuse the service, attempt to disrupt it, or use it to violate laws or the rights of
                others. We may suspend accounts that abuse the platform.
              </Section>
              <Section title="Liability">
                To the maximum extent permitted by law, Machinarc is not liable for indirect or consequential damages.
                The service is provided without warranties during beta.
              </Section>
              <Section title="Contact">
                Questions about these terms can be sent to support@machinarc.com.
              </Section>
            </>
          ) : (
            <>
              <Section title="Overview">
                This policy explains what we collect, how we use it, and your choices. We aim to collect only what we
                need to run the service.
              </Section>
              <Section title="Information we collect">
                Account details (email), workspace metadata, and operational data such as agents, API key metadata, and
                audit logs. We store hashes of secrets — never plaintext secret keys.
              </Section>
              <Section title="How we use it">
                To provide and secure the service, authenticate requests, enforce permissions, and maintain audit
                history. We do not sell your data.
              </Section>
              <Section title="Cookies & sessions">
                We use a session token to keep you signed in. No third-party advertising trackers.
              </Section>
              <Section title="Data retention">
                Audit logs and account data are retained while your account is active. You can request deletion at any
                time.
              </Section>
              <Section title="Your rights">
                You may access, export, or delete your data. Contact support@machinarc.com to make a request.
              </Section>
              <Section title="Contact">
                Questions about privacy can be sent to support@machinarc.com.
              </Section>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-[#1a1413]/10 bg-[#efe6de]">
        <div className="mx-auto max-w-3xl px-5 py-8 text-sm text-[#1a1413]/60 sm:px-8">
          <button onClick={onBack} className="hover:text-[#9a0002]">Back to home</button>
        </div>
      </footer>
    </div>
  );
}
