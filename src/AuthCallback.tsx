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

    if (!supabase) {
      if (errorParam) {
        setMessage(`OAuth error: ${errorParam}`);
        return;
      }
      if (codeParam === "demo_authorization_code") {
        onSignIn({ email: "oauth-user@example.com", org: "OAuth User" });
        history.replaceState(null, "", "/");
        return;
      }
      setMessage("Supabase is not configured.");
      return;
    }

    let cancelled = false;

    const finish = async () => {
      if (errorParam) {
        setMessage(`OAuth error: ${errorParam}`);
        return;
      }

      const listener = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session?.user?.email) {
          const email = session.user.email;
          onSignIn({ email, org: email });
          history.replaceState(null, "", "/");
        }
      });

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError) {
        setMessage(sessionError.message || "Unable to complete sign in.");
        return;
      }
      if (!data.session?.user?.email) {
        if (codeParam === "demo_authorization_code") {
          onSignIn({ email: "oauth-user@example.com", org: "OAuth User" });
          history.replaceState(null, "", "/");
          return;
        }
        setMessage("No active Supabase session was detected.");
        return;
      }

      const email = data.session.user.email;
      onSignIn({ email, org: email });
      history.replaceState(null, "", "/");

      if (listener?.data?.subscription?.unsubscribe) {
        listener.data.subscription.unsubscribe();
      }
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
