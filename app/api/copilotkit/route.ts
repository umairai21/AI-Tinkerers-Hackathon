import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { openrouter, OPENROUTER_MODEL } from "@/lib/openrouter";

const serviceAdapter = new OpenAIAdapter({
  openai: openrouter,
  model: OPENROUTER_MODEL,
});

export const POST = async (req: NextRequest) => {
  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
