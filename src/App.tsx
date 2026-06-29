import { useEffect, useState } from "react";
import Landing from "./Landing";
import Auth from "./Auth";
import AuthAuthorize from "./AuthAuthorize";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import Roadmap from "./Roadmap";
import PublicDocs from "./PublicDocs";
import Legal from "./Legal";
import { getSession, signOut, type Session } from "./store";
import { api, apiEnabled, clearToken, setToken } from "./api";
import ThemeToggle from "./ThemeToggle";

type View = "landing" | "auth" | "authorize" | "callback" | "app" | "roadmap" | "docs" | "terms" | "privacy";

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
    const path = new URL(window.location.href).pathname;
    if (path === "/auth/callback") {
      setView("callback");
      return;
    }
    if (path === "/auth/authorize") {
      setView("authorize");
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
          setSession({ email: me.email, org: me.workspace });
          setView("app");
        })
        .catch(() => clearToken());
    }
  }, []);

  const goStart = () => {
    if (session) {
      setView("app");
    } else {
      setAuthMode("signup");
      setView("auth");
    }
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
          setSession(s);
          setView("app");
        }}
      />
    );
  } else if (view === "authorize") {
    screen = (
      <AuthAuthorize
        onSignIn={(s) => {
          setSession(s);
          setView("app");
        }}
      />
    );
  } else if (view === "callback") {
    screen = (
      <AuthCallback
        onSignIn={(s) => {
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
      onSignUp={goStart}
      onSignIn={() => {
        if (session) {
          setView("app");
        } else {
          setAuthMode("signin");
          setView("auth");
        }
      }}
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
