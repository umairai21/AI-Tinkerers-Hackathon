"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CopilotKit } from "@copilotkit/react-core";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  const runtimeUrl =
    typeof window !== "undefined"
      ? new URL("/api/copilotkit", window.location.origin).toString()
      : "/api/copilotkit";

  return (
    <ConvexProvider client={convex}>
      <CopilotKit runtimeUrl={runtimeUrl} enableInspector={false}>{children}</CopilotKit>
    </ConvexProvider>
  );
}
