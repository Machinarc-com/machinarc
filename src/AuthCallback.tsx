import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { LogoMark } from "./Logo";
import type { Session } from "./store";

export default function AuthCallback({ onSignIn }: { onSignIn: (session: Session) => void }) {
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const errorParam = search.get("error");
    const codeParam = search.get("code");
    const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;

    const renderError = (text: string) => {
      setMessage(`${text} \nURL: ${currentUrl}`);
    };

    if (!supabase) {
      if (errorParam) {
        renderError(`OAuth error: ${errorParam}`);
        return;
      }
      if (codeParam === "demo_authorization_code") {
        onSignIn({ email: "oauth-user@example.com", org: "OAuth User" });
        history.replaceState(null, "", "/");
        return;
      }
      renderError("Supabase is not configured.");
      return;
    }

    let cancelled = false;

    const finish = async () => {
      if (errorParam) {
        setMessage(`OAuth error: ${errorParam}`);
        return;
      }

      if (codeParam === "demo_authorization_code") {
        onSignIn({ email: "oauth-user@example.com", org: "OAuth User" });
        history.replaceState(null, "", "/");
        return;
      }

      let sessionData = null;
      if (codeParam || window.location.hash.includes("access_token")) {
        const { data, error: urlError } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (cancelled) return;
        if (urlError) {
          setMessage(urlError.message || "Unable to complete OAuth sign in.");
          return;
        }
        sessionData = data.session;
      }

      if (!sessionData) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionError) {
          setMessage(sessionError.message || "Unable to complete sign in.");
          return;
        }
        sessionData = data.session;
      }

      if (!sessionData?.user?.email) {
        setMessage("No active Supabase session was detected.");
        return;
      }

      const email = sessionData.user.email;
      onSignIn({ email, org: email });
      history.replaceState(null, "", "/");
    };

    finish();

    return () => {
      cancelled = true;
    };
  }, [onSignIn]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#efe6de] px-5 text-[#1a1413]">
      <div className="w-full max-w-sm rounded-2xl border border-[#1a1413]/12 bg-[#f5efe8] p-7 text-center">
        <div className="flex items-center justify-center gap-3">
          <LogoMark />
          <span className="font-display text-xl font-semibold tracking-tight">Machinarc</span>
        </div>
        <p className="mt-6 text-sm text-[#1a1413]/70">Authentication callback in progress.</p>
        <p className="mt-4 rounded-xl bg-[#efe6de] px-4 py-3 text-sm text-[#1a1413]/90">{message}</p>
      </div>
    </div>
  );
}
