import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "./Logo";
import type { Session } from "./store";

function parseQueryParams(search: string) {
  const params = new URLSearchParams(search);
  return {
    clientId: params.get("client_id") ?? "",
    redirectUri: params.get("redirect_uri") ?? "",
    responseType: params.get("response_type") ?? "code",
    scope: params.get("scope") ?? "",
    state: params.get("state") ?? "",
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#efe6de] px-5 text-[#1a1413]">
      <div className="w-full max-w-lg rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-8">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="font-display text-xl font-semibold tracking-tight">Machinarc OAuth Consent</span>
        </div>
        <p className="mt-4 text-sm text-[#1a1413]/60">Grant access to the requesting application.</p>
        <div className="mt-6 rounded-2xl border border-[#1a1413]/10 bg-white p-5 text-sm text-[#1a1413]">
          <p className="font-semibold">Client ID</p>
          <p className="mt-1 break-words">{params.clientId || "(not provided)"}</p>
          <p className="mt-4 font-semibold">Requested scope</p>
          <p className="mt-1 break-words">{params.scope || "default"}</p>
          <p className="mt-4 font-semibold">Response type</p>
          <p className="mt-1 break-words">{params.responseType}</p>
          <p className="mt-4 font-semibold">Redirect URI</p>
          <p className="mt-1 break-words">{params.redirectUri || "(not provided)"}</p>
        </div>
        <p className="mt-6 rounded-xl bg-[#efe6de] px-4 py-3 text-sm text-[#1a1413]/90">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="w-full rounded-md bg-[#1a1413] px-4 py-3 text-sm font-medium text-[#efe6de] transition-colors hover:bg-[#333]"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="w-full rounded-md border border-[#1a1413]/20 bg-[#efe6de] px-4 py-3 text-sm font-medium text-[#1a1413] transition-colors hover:border-[#9a0002]"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}
