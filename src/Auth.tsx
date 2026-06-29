import { useState } from "react";
import { continueWithGoogle, login, register, resetPassword, type Session } from "./store";
import { ApiError, api, apiEnabled, setToken } from "./api";
import { LogoMark } from "./Logo";

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Auth({
  initialMode = "signup",
  onSignIn,
  onBack,
}: {
  initialMode?: "signup" | "signin";
  onSignIn: (s: Session) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<"signup" | "signin" | "reset">(initialMode);
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = () => {
    setError("");
    setNotice("");

    if (mode === "reset") {
      if (!email.trim() || !password.trim()) return;
      const res = resetPassword(email, password);
      if (!res.ok) {
        setError(res.error ?? "Could not reset password.");
        return;
      }
      setNotice("Password updated. You can now sign in.");
      setMode("signin");
      setPassword("");
      return;
    }

    if (!email.trim() || !password.trim()) return;
    if (mode === "signup" && !workspace.trim()) {
      setError("Workspace name is required.");
      return;
    }

    // Real backend when configured (VITE_API_URL), else local-demo store.
    if (apiEnabled) {
      const run = mode === "signup" ? api.register(email, password, workspace) : api.login(email, password);
      run
        .then((res) => {
          setToken(res.access_token);
          onSignIn({ email: res.email, org: res.workspace });
        })
        .catch((e) => setError(e instanceof ApiError ? e.message : "Authentication failed."));
      return;
    }

    if (mode === "signup") {
      const res = register(email, password, workspace);
      if (!res.ok || !res.session) {
        setError(res.error ?? "Could not create account.");
        return;
      }
      onSignIn(res.session);
    } else {
      const res = login(email, password);
      if (!res.ok || !res.session) {
        setError(res.error ?? "Could not sign in.");
        return;
      }
      onSignIn(res.session);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#efe6de] px-5 text-[#1a1413]">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="mb-6 text-sm text-[#9a0002] hover:underline">
          ← Back
        </button>
        <div className="rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-7">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight">Machinarc</span>
          </div>

          {mode !== "reset" && (
            <div className="mt-6 inline-flex rounded-md border border-[#1a1413]/15 p-1 text-sm">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setNotice("");
                }}
                className={`rounded px-3 py-1.5 transition-colors ${
                  mode === "signup" ? "bg-[#9a0002] text-[#efe6de]" : "text-[#1a1413]/60"
                }`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setNotice("");
                }}
                className={`rounded px-3 py-1.5 transition-colors ${
                  mode === "signin" ? "bg-[#9a0002] text-[#efe6de]" : "text-[#1a1413]/60"
                }`}
              >
                Sign in
              </button>
            </div>
          )}

          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your workspace" : mode === "reset" ? "Reset your password" : "Sign in to Machinarc"}
          </h1>
          <p className="mt-2 text-sm text-[#1a1413]/60">The identity layer for autonomous systems.</p>

          {notice ? <p className="mt-4 text-sm text-[#1a7a31]">{notice}</p> : null}

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {mode === "signup" && (
              <input
                required
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                placeholder="Workspace name (e.g. Acme Inc.)"
                aria-label="Workspace name"
                className="w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#1a1413]/40 focus:border-[#9a0002]"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              aria-label="Work email"
              className="w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#1a1413]/40 focus:border-[#9a0002]"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "reset" ? "New password" : "Password"}
              aria-label="Password"
              className="w-full rounded-md border border-[#1a1413]/15 bg-[#efe6de] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#1a1413]/40 focus:border-[#9a0002]"
            />

            {error ? <p className="text-sm text-[#9a0002]">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-md bg-[#9a0002] px-4 py-3 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#b32426] active:scale-[0.98]"
            >
              {mode === "signup" ? "Create workspace" : mode === "reset" ? "Update password" : "Sign in"}
            </button>
          </form>

          {mode !== "reset" && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#1a1413]/15" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1a1413]/40">or</span>
                <span className="h-px flex-1 bg-[#1a1413]/15" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                  if (apiEnabled) {
                    // real Google OAuth — backend handles the flow and redirects back with a token
                    window.location.href = api.googleStartUrl();
                    return;
                  }
                  const guess = email.trim() || "you@gmail.com";
                  const input = window.prompt("Continue with Google — enter your Google email", guess);
                  if (!input) return;
                  const res = continueWithGoogle(input);
                  if (!res.ok || !res.session) {
                    setError("Could not continue with Google.");
                    return;
                  }
                  onSignIn(res.session);
                }}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-[#1a1413]/20 bg-[#efe6de] px-4 py-3 text-sm font-medium text-[#1a1413] transition-colors hover:border-[#9a0002] active:scale-[0.98]"
              >
                <GoogleMark />
                Continue with Google
              </button>
            </>
          )}

          {mode === "signin" && (
            <p className="mt-3 text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setError("");
                  setNotice("");
                }}
                className="text-[#9a0002] hover:underline"
              >
                Forgot password?
              </button>
            </p>
          )}

          <p className="mt-4 text-center text-xs text-[#1a1413]/55">
            {mode === "signup" ? "Already have an account? " : mode === "reset" ? "Remembered it? " : "New to Machinarc? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : mode === "reset" ? "signin" : "signup");
                setError("");
                setNotice("");
              }}
              className="text-[#9a0002] hover:underline"
            >
              {mode === "signup" ? "Sign in" : mode === "reset" ? "Back to sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
