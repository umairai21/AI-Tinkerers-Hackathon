"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { CopilotKit } from "@copilotkit/react-core";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  const runtimeUrl =
    typeof window !== "undefined"
      ? new URL("/api/copilotkit", window.location.origin).toString()
      : "/api/copilotkit";

  return (
    <ConvexAuthProvider client={convex}>
      <CopilotKit
        runtimeUrl={runtimeUrl}
        enableInspector={false}
        textToSpeechUrl="/api/tts"
      >
        {children}
      </CopilotKit>
    </ConvexAuthProvider>
  );
}

// No login form: the first visit silently signs the browser in as a new anonymous
// user, and the token in localStorage keeps it the same customer on later visits.
export function AnonymousSession({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const signingIn = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) signingIn.current = false;
    if (isLoading || isAuthenticated || signingIn.current) return;
    signingIn.current = true;
    signIn("anonymous").catch(() => {
      signingIn.current = false;
      setError(true);
    });
  }, [isLoading, isAuthenticated, signIn]);

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto w-full p-6 text-sm text-slate-500">
        {error ? "Couldn't start your session. Please refresh the page." : "Setting up your session..."}
      </main>
    );
  }
  return children;
}
