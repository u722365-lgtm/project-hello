import { supabase } from "@/integrations/supabase/client";
import type { JulesActivity, JulesSession, JulesSource } from "./types";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jules-agent`;

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };
}

async function julesRequest<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Jules request failed");
  }
  return data as T;
}

export async function verifyJulesApiKey(apiKey: string): Promise<boolean> {
  await julesRequest({ action: "verify", apiKey });
  return true;
}

export async function listJulesSources(apiKey: string): Promise<JulesSource[]> {
  const data = await julesRequest<{ sources?: JulesSource[] }>({ action: "listSources", apiKey });
  return data.sources ?? [];
}

export interface CreateJulesSessionInput {
  apiKey: string;
  prompt: string;
  title?: string;
  source?: string;
  branch?: string;
  requirePlanApproval?: boolean;
  automationMode?: "AUTO_CREATE_PR";
}

export async function createJulesSession(input: CreateJulesSessionInput): Promise<JulesSession> {
  return julesRequest<JulesSession>({
    action: "createSession",
    apiKey: input.apiKey,
    prompt: input.prompt,
    title: input.title,
    source: input.source,
    branch: input.branch,
    requirePlanApproval: input.requirePlanApproval,
    automationMode: input.automationMode,
  });
}

export async function getJulesSession(apiKey: string, sessionId: string): Promise<JulesSession> {
  return julesRequest<JulesSession>({ action: "getSession", apiKey, sessionId });
}

export async function listJulesActivities(
  apiKey: string,
  sessionId: string,
  createTime?: string,
): Promise<JulesActivity[]> {
  const data = await julesRequest<{ activities?: JulesActivity[] }>({
    action: "listActivities",
    apiKey,
    sessionId,
    createTime,
  });
  return data.activities ?? [];
}

export async function sendJulesMessage(
  apiKey: string,
  sessionId: string,
  prompt: string,
): Promise<void> {
  await julesRequest({ action: "sendMessage", apiKey, sessionId, prompt });
}

export async function approveJulesPlan(apiKey: string, sessionId: string): Promise<void> {
  await julesRequest({ action: "approvePlan", apiKey, sessionId });
}
