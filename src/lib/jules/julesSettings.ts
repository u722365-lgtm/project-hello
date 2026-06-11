const API_KEY_KEY = "shadowtalk_jules_api_key";
const MODE_KEY = "shadowtalk_jules_mode";
const SOURCE_KEY = "shadowtalk_jules_github_source";
const BRANCH_KEY = "shadowtalk_jules_github_branch";

export function getJulesApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setJulesApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(API_KEY_KEY, trimmed);
  else localStorage.removeItem(API_KEY_KEY);
}

export function getJulesMode(): "workspace" | "github" {
  try {
    return localStorage.getItem(MODE_KEY) === "github" ? "github" : "workspace";
  } catch {
    return "workspace";
  }
}

export function setJulesMode(mode: "workspace" | "github"): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function getJulesGithubSource(): string {
  try {
    return localStorage.getItem(SOURCE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setJulesGithubSource(source: string): void {
  const trimmed = source.trim();
  if (trimmed) localStorage.setItem(SOURCE_KEY, trimmed);
  else localStorage.removeItem(SOURCE_KEY);
}

export function getJulesGithubBranch(): string {
  try {
    return localStorage.getItem(BRANCH_KEY)?.trim() || "main";
  } catch {
    return "main";
  }
}

export function setJulesGithubBranch(branch: string): void {
  localStorage.setItem(BRANCH_KEY, branch.trim() || "main");
}
