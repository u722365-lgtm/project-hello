import type { JulesActivity, JulesSession, JulesSource } from "./types";

async function julesRequest<T>(_body: Record<string, unknown>): Promise<T> {
  throw new Error("Jules cloud agent is disabled");
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
