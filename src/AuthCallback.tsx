import { useEffect, useState } from "react";
import { supabase, supabaseUrl } from "./supabase";
import { LogoMark } from "./Logo";
import { saveSession, type Session } from "./store";

export default function AuthCallback({ onSignIn }: { onSignIn: (session: Session) => void }) {
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const errorParam = search.get("error");
    const codeParam = search.get("code");
    const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;

    const renderError = (text: string) => {
      setMessage(
        `${text} \nURL: ${currentUrl} \nSupabase configured: ${Boolean(supabase)} \nSupabase URL: ${supabaseUrl}`,
      );
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
        const demoSession = { email: "oauth-user@example.com", org: "OAuth User" };
        saveSession(demoSession);
        onSignIn(demoSession);
        history.replaceState(null, "", "/");
        return;
      }

      let sessionData = null;
      let exchangeResult: any = null;
      if (codeParam) {
        exchangeResult = await supabase.auth.exchangeCodeForSession(codeParam);
        if (cancelled) return;
        if (exchangeResult.error) {
          setMessage(
            `${exchangeResult.error.message || "Unable to complete OAuth sign in."}\n` +
              `Exchange result: ${JSON.stringify(exchangeResult, null, 2)}`,
          );
          return;
        }
        sessionData = exchangeResult.data?.session ?? null;
      }

      const hasHashToken = Boolean(
        window.location.hash &&
          (window.location.hash.includes("access_token") || window.location.hash.includes("refresh_token")),
      );

      if (!sessionData) {
        if (hasHashToken) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        const sessionResult = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionResult.error) {
          setMessage(
            `${sessionResult.error.message || "Unable to complete sign in."}\n` +
              `Session result: ${JSON.stringify(sessionResult, null, 2)}`,
          );
          return;
        }
        sessionData = sessionResult.data?.session ?? null;
      }

      if (!sessionData && hasHashToken) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const retryResult = await supabase.auth.getSession();
        if (cancelled) return;
        if (!retryResult.error) {
          sessionData = retryResult.data?.session ?? null;
        }
      }

      if (!sessionData?.user?.email) {
        setMessage(
          `No active Supabase session was detected.\n` +
            `Exchange result: ${JSON.stringify(exchangeResult, null, 2)}\n` +
            `Session data: ${JSON.stringify(sessionData, null, 2)}`,
        );
        return;
      }

      const email = sessionData.user.email;
      const nextSession = { email, org: sessionData.user.user_metadata?.org ?? email };
      saveSession(nextSession);
      onSignIn(nextSession);
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
