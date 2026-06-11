import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type RoutingMode = "auto" | "local-only" | "cloud-only";
export type SovereignMode = "auto" | "sovereign" | "cloud-only";

export interface ShadowTalkConfig {
  routing: { mode: RoutingMode };
  sovereign: { mode: SovereignMode };
  ollama: { url: string; model: string };
  pledge: { deviceOnly: boolean; cloudOptIn: boolean };
  supabase?: {
    url?: string;
    anonKey?: string;
    accessToken?: string;
  };
}

const CONFIG_DIR = join(homedir(), ".shadowtalk");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULTS: ShadowTalkConfig = {
  routing: { mode: "local-only" },
  sovereign: { mode: "sovereign" },
  ollama: { url: "http://127.0.0.1:11434", model: "qwen2.5:7b" },
  pledge: { deviceOnly: true, cloudOptIn: false },
};

let cache: ShadowTalkConfig | null = null;

function mergeConfig(partial: Partial<ShadowTalkConfig>): ShadowTalkConfig {
  return {
    routing: { ...DEFAULTS.routing, ...partial.routing },
    sovereign: { ...DEFAULTS.sovereign, ...partial.sovereign },
    ollama: { ...DEFAULTS.ollama, ...partial.ollama },
    pledge: { ...DEFAULTS.pledge, ...partial.pledge },
    supabase: { ...partial.supabase },
  };
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): ShadowTalkConfig {
  if (cache) return cache;

  if (!existsSync(CONFIG_PATH)) {
    cache = { ...DEFAULTS };
    saveConfig(cache);
    return cache;
  }

  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Partial<ShadowTalkConfig>;
    cache = mergeConfig(raw);
    return cache;
  } catch {
    cache = { ...DEFAULTS };
    return cache;
  }
}

export function saveConfig(config: ShadowTalkConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  cache = config;
}

export function getConfigValue(path: string): unknown {
  const cfg = loadConfig();
  const parts = path.split(".");
  let cur: unknown = cfg;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function setConfigValue(path: string, value: unknown): void {
  const cfg = loadConfig();
  const parts = path.split(".");
  let cur: Record<string, unknown> = cfg as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof cur[key] !== "object" || cur[key] === null) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  saveConfig(cfg);
}

export function resetConfigCache(): void {
  cache = null;
}
