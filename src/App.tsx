import { useEffect, useState } from "react";
import Landing from "./Landing";
import Auth from "./Auth";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import Roadmap from "./Roadmap";
import PublicDocs from "./PublicDocs";
import Legal from "./Legal";
import { getSession, saveSession, signOut, type Session } from "./store";
import { api, apiEnabled, clearToken, setToken } from "./api";
import { supabase } from "./supabase";
import ThemeToggle from "./ThemeToggle";

type View = "landing" | "auth" | "callback" | "app" | "roadmap" | "docs" | "terms" | "privacy";

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [view, setView] = useState<View>(() => (getSession() ? "app" : "landing"));
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#app" && getSession()) setView("app");
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Always start a new view at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const rawPath = new URL(window.location.href).pathname;
    const path = rawPath.replace(/\/\/+/g, "/");
    const restoreSupabaseSession = async () => {
      if (!supabase) return;
      if (path.startsWith("/auth/callback")) return;
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session?.user?.email) return;
      const nextSession = {
        email: session.user.email,
        org: session.user.user_metadata?.org ?? session.user.email,
      };
      saveSession(nextSession);
      setSession(nextSession);
      setView("app");
    };

    void restoreSupabaseSession();
    if (path === "/auth/callback") {
      setView("callback");
      return;
    }

    if (!apiEnabled) return;

    const match = window.location.hash.match(/token=([^&]+)/);
    if (match) {
      setToken(decodeURIComponent(match[1]));
      history.replaceState(null, "", window.location.pathname);
      api
        .me()
        .then((me) => {
          const nextSession = { email: me.email, org: me.workspace };
          saveSession(nextSession);
          setSession(nextSession);
          setView("app");
        })
        .catch(() => clearToken());
    }
  }, []);

  const goExternalAuth = () => {
    setView("auth");
  };

  const goStart = () => {
    goExternalAuth();
  };

  let screen: React.ReactNode;
  if (view === "app" && session) {
    screen = (
      <Dashboard
        session={session}
        onSession={setSession}
        onSignOut={() => {
          signOut();
          clearToken();
          setSession(null);
          setView("landing");
        }}
      />
    );
  } else if (view === "auth") {
    screen = (
      <Auth
        initialMode={authMode}
        onBack={() => setView("landing")}
        onSignIn={(s) => {
          saveSession(s);
          setSession(s);
          setView("app");
        }}
      />
    );
  } else if (view === "callback") {
    screen = (
      <AuthCallback
        onSignIn={(s) => {
          saveSession(s);
          setSession(s);
          setView("app");
        }}
      />
    );
  } else if (view === "roadmap") {
    screen = <Roadmap onBack={() => setView("landing")} onStart={goStart} />;
  } else if (view === "docs") {
    screen = <PublicDocs onBack={() => setView("landing")} onStart={goStart} />;
  } else if (view === "terms") {
    screen = <Legal kind="terms" onBack={() => setView("landing")} />;
  } else if (view === "privacy") {
    screen = <Legal kind="privacy" onBack={() => setView("landing")} />;
  } else {
    screen = (
      <Landing
        onSignUp={goExternalAuth}
        onSignIn={goExternalAuth}
        onRoadmap={() => setView("roadmap")}
        onDocs={() => setView("docs")}
        onTerms={() => setView("terms")}
        onPrivacy={() => setView("privacy")}
      />
    );
  }

  return (
    <>
      {screen}
      <ThemeToggle />
    </>
  );
}
