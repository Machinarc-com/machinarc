import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "./Logo";
import type { Session } from "./store";

function parseQueryParams(search: string) {
  const params = new URLSearchParams(search);
  const origin = window.location.origin;
  return {
    clientId: params.get("client_id") ?? "demo-client",
    redirectUri: params.get("redirect_uri") ?? `${origin}/auth/callback`,
    responseType: params.get("response_type") ?? "code",
    scope: params.get("scope") ?? "openid email",
    state: params.get("state") ?? "demo_state",
    hadClientId: params.has("client_id"),
    hadRedirectUri: params.has("redirect_uri"),
    hadScope: params.has("scope"),
    hadState: params.has("state"),
  };
}

function buildRedirectUri(params: ReturnType<typeof parseQueryParams>, approved: boolean) {
  const target = params.redirectUri;
  if (!target) return null;

  const stateSegment = params.state ? `&state=${encodeURIComponent(params.state)}` : "";

  if (!approved) {
    const separator = target.includes("?") ? "&" : "?";
    return `${target}${separator}error=access_denied${stateSegment}`;
  }

  if (params.responseType === "token") {
    const fragment = `#access_token=demo_access_token&token_type=bearer&expires_in=3600${stateSegment}`;
    return `${target}${fragment}`;
  }

  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}code=demo_authorization_code${stateSegment}`;
}

export default function AuthAuthorize({ onSignIn }: { onSignIn: (session: Session) => void }) {
  const [message, setMessage] = useState("Review authorization request.");
  const params = useMemo(() => parseQueryParams(window.location.search), []);

  useEffect(() => {
    if (!params.redirectUri) {
      setMessage("No redirect_uri provided. This page is only for OAuth authorization flows.");
    }
  }, [params.redirectUri]);

  const handleConsent = (approved: boolean) => {
    const redirect = buildRedirectUri(params, approved);
    if (!redirect) {
      setMessage("Cannot redirect because redirect_uri is missing or invalid.");
      return;
    }
    window.location.href = redirect;
  };

  const missingParams = !params.hadClientId || !params.hadRedirectUri || !params.hadScope || !params.hadState;
  const reloadDemoFlow = () => {
    const origin = window.location.origin;
    window.location.href = `${origin}/auth/authorize?client_id=demo-client&redirect_uri=${encodeURIComponent(
      `${origin}/auth/callback`
    )}&response_type=code&scope=openid%20email&state=demo_state`;
  };

  return (
    <div className="min-h-screen bg-[#efe6de] px-5 py-10 text-[#1a1413]">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-7 shadow-sm">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#9a0002] hover:underline"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Machinarc</h1>
            <p className="text-sm text-[#1a1413]/60">OAuth authorization</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#1a1413]/60">The identity layer for autonomous systems.</p>

        <div className="mt-8 rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#1a1413]">Authorize access</h2>
          <p className="mt-2 text-sm leading-6 text-[#1a1413]/65">
            Grant the requesting application permission to access your Machinarc account on your behalf.
          </p>

          <div className="mt-6 grid gap-4 text-sm text-[#1a1413] sm:grid-cols-2">
            <div className="rounded-3xl border border-[#1a1413]/15 bg-white p-4">
              <p className="font-semibold">Client</p>
              <p className="mt-1 break-words text-[#1a1413]/80">{params.clientId || "(not provided)"}</p>
            </div>
            <div className="rounded-3xl border border-[#1a1413]/15 bg-white p-4">
              <p className="font-semibold">Scope</p>
              <p className="mt-1 break-words text-[#1a1413]/80">{params.scope || "default"}</p>
            </div>
            <div className="rounded-3xl border border-[#1a1413]/15 bg-white p-4">
              <p className="font-semibold">Response type</p>
              <p className="mt-1 break-words text-[#1a1413]/80">{params.responseType}</p>
            </div>
            <div className="rounded-3xl border border-[#1a1413]/15 bg-white p-4">
              <p className="font-semibold">Redirect URI</p>
              <p className="mt-1 break-words text-[#1a1413]/80">{params.redirectUri || "(not provided)"}</p>
            </div>
          </div>
        </div>

        <p className="mt-6 rounded-3xl border border-[#9a0002]/10 bg-[#f7f0e9] px-4 py-3 text-sm text-[#1a1413]/90">
          {message}
        </p>

        {missingParams ? (
          <div className="mt-4 rounded-3xl border border-[#1a1413]/15 bg-[#fff8f1] p-4 text-sm text-[#9a1413]">
            <p className="font-semibold">OAuth parameters were missing.</p>
            <p className="mt-2">Reload the consent flow with default demo values.</p>
            <button
              type="button"
              onClick={reloadDemoFlow}
              className="mt-3 rounded-3xl bg-[#9a0002] px-4 py-3 text-sm font-semibold text-[#efe6de] transition-colors hover:bg-[#b32426]"
            >
              Reload demo auth flow
            </button>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="rounded-3xl bg-[#9a0002] px-4 py-3 text-sm font-semibold text-[#efe6de] transition-colors hover:bg-[#b32426]"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="rounded-3xl border border-[#1a1413]/15 bg-[#efe6de] px-4 py-3 text-sm font-semibold text-[#1a1413] transition-colors hover:border-[#9a0002]"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}
