import { useCallback, useEffect, useState } from "react";
import {
  Bot, ExternalLink, Key, Loader2, Play, Check, GitBranch,
  FolderCode, RefreshCw, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useJulesAgent } from "@/hooks/useJulesAgent";
import {
  getJulesApiKey,
  setJulesApiKey,
  getJulesMode,
  setJulesMode,
  getJulesGithubSource,
  setJulesGithubSource,
  getJulesGithubBranch,
  setJulesGithubBranch,
} from "@/lib/jules/julesSettings";
import { listJulesSources, verifyJulesApiKey } from "@/lib/jules/julesClient";
import type { JulesSource, JulesWorkspaceFile } from "@/lib/jules/types";
import type { ParsedFileChange } from "@/lib/jules/types";

const QUICK_TASKS = [
  { label: "Refactor project", prompt: "Refactor this project for clarity, maintainability, and modern best practices." },
  { label: "Add tests", prompt: "Add comprehensive tests for the core logic in this project." },
  { label: "Fix bugs", prompt: "Find and fix bugs, edge cases, and runtime errors in this codebase." },
  { label: "Add accessibility", prompt: "Improve accessibility (ARIA, semantic HTML, keyboard nav, contrast)." },
];

interface JulesPanelProps {
  files: JulesWorkspaceFile[];
  activeFileName?: string;
  onApplyChanges: (changes: ParsedFileChange[]) => void;
}

export function JulesPanel({ files, activeFileName, onApplyChanges }: JulesPanelProps) {
  const [apiKey, setApiKeyState] = useState(getJulesApiKey);
  const [mode, setModeState] = useState<"workspace" | "github">(getJulesMode);
  const [githubSource, setGithubSourceState] = useState(getJulesGithubSource);
  const [githubBranch, setGithubBranchState] = useState(getJulesGithubBranch);
  const [task, setTask] = useState("");
  const [showSettings, setShowSettings] = useState(!apiKey);
  const [keyStatus, setKeyStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [sources, setSources] = useState<JulesSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [followUp, setFollowUp] = useState("");

  const agent = useJulesAgent({
    apiKey,
    mode,
    githubSource,
    githubBranch,
    files,
    activeFileName,
  });

  const saveApiKey = useCallback((key: string) => {
    setJulesApiKey(key);
    setApiKeyState(key);
  }, []);

  const saveMode = useCallback((m: "workspace" | "github") => {
    setJulesMode(m);
    setModeState(m);
  }, []);

  const verifyKey = useCallback(async () => {
    if (!apiKey.trim()) {
      setKeyStatus("error");
      return;
    }
    setKeyStatus("checking");
    try {
      await verifyJulesApiKey(apiKey);
      setKeyStatus("ok");
      setShowSettings(false);
    } catch {
      setKeyStatus("error");
    }
  }, [apiKey]);

  const loadSources = useCallback(async () => {
    if (!apiKey.trim()) return;
    setLoadingSources(true);
    try {
      const list = await listJulesSources(apiKey);
      setSources(list);
      if (!githubSource && list[0]?.name) {
        setGithubSourceState(list[0].name);
        setJulesGithubSource(list[0].name);
      }
    } catch {
      setSources([]);
    } finally {
      setLoadingSources(false);
    }
  }, [apiKey, githubSource]);

  useEffect(() => {
    if (apiKey && mode === "github") void loadSources();
  }, [apiKey, mode, loadSources]);

  const handleApply = () => {
    if (agent.pendingChanges.length === 0) return;
    onApplyChanges(agent.pendingChanges);
    agent.clearPendingChanges();
    agent.setError(null);
  };

  const state = agent.session?.state;
  const needsApproval = state === "AWAITING_PLAN_APPROVAL";
  const needsFeedback = state === "AWAITING_USER_FEEDBACK";
  const prUrl = agent.session?.outputs?.find((o) => o.pullRequest?.url)?.pullRequest?.url;

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold">Jules</span>
          <Badge variant="secondary" className="text-[10px] h-5">Google AI</Badge>
          {agent.isPolling && <Loader2 className="h-3 w-3 animate-spin text-violet-400" />}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowSettings((s) => !s)}>
            <Key className="h-3.5 w-3.5" />
          </Button>
          {agent.session && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={agent.reset}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Settings */}
          {showSettings && (
            <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Jules is Google&apos;s autonomous coding agent. Get an API key at{" "}
                <a
                  href="https://jules.google.com/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:underline"
                >
                  jules.google.com/settings
                </a>
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    saveApiKey(e.target.value);
                    setKeyStatus("idle");
                  }}
                  placeholder="Jules API key"
                  className="h-8 text-xs font-mono"
                />
                <Button size="sm" className="h-8 shrink-0" onClick={() => void verifyKey()} disabled={keyStatus === "checking"}>
                  {keyStatus === "checking" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify"}
                </Button>
              </div>
              {keyStatus === "ok" && <p className="text-[11px] text-emerald-400">API key verified</p>}
              {keyStatus === "error" && <p className="text-[11px] text-red-400">Invalid or missing API key</p>}

              <div className="flex gap-1">
                <Button
                  variant={mode === "workspace" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => saveMode("workspace")}
                >
                  <FolderCode className="h-3 w-3" /> Workspace
                </Button>
                <Button
                  variant={mode === "github" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => saveMode("github")}
                >
                  <GitBranch className="h-3 w-3" /> GitHub
                </Button>
              </div>

              {mode === "github" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={githubSource}
                      onChange={(e) => {
                        setGithubSourceState(e.target.value);
                        setJulesGithubSource(e.target.value);
                      }}
                      className="flex-1 h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="">Select GitHub repo…</option>
                      {sources.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => void loadSources()} disabled={loadingSources}>
                      <RefreshCw className={cn("h-3 w-3", loadingSources && "animate-spin")} />
                    </Button>
                  </div>
                  <Input
                    value={githubBranch}
                    onChange={(e) => {
                      setGithubBranchState(e.target.value);
                      setJulesGithubBranch(e.target.value);
                    }}
                    placeholder="Branch (main)"
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Task input */}
          {!agent.session && (
            <>
              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder={
                  mode === "workspace"
                    ? "Describe what Jules should do with your IDE workspace…"
                    : "Describe the task for your GitHub repo…"
                }
                className="min-h-[80px] text-xs resize-none"
              />
              <div className="flex flex-wrap gap-1">
                {QUICK_TASKS.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setTask(q.prompt)}
                    className="text-[10px] px-2 py-1 rounded-full border border-border hover:border-violet-500/50 hover:bg-violet-500/10 transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <Button
                className="w-full h-8 gap-2 bg-violet-600 hover:bg-violet-500"
                disabled={!apiKey || agent.isStarting || (mode === "github" && !githubSource)}
                onClick={() => void agent.startSession(task)}
              >
                {agent.isStarting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Delegate to Jules
              </Button>
              {mode === "workspace" && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Sends {files.length} workspace file{files.length === 1 ? "" : "s"} as context (repoless cloud session)
                </p>
              )}
            </>
          )}

          {/* Active session */}
          {agent.session && (
            <div className="space-y-2">
              <div className="rounded-lg border border-border p-2.5 bg-muted/10">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate">{agent.session.title ?? "Jules session"}</p>
                  {state && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {state}
                    </Badge>
                  )}
                </div>
                {agent.statusLine && (
                  <p className="text-[11px] text-muted-foreground mt-1">{agent.statusLine}</p>
                )}
                {agent.session.url && (
                  <a
                    href={agent.session.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:underline mt-1"
                  >
                    Open in Jules <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {prUrl && (
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-1 ml-2"
                  >
                    View PR <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {needsApproval && (
                <Button size="sm" className="w-full h-8" onClick={() => void agent.approvePlan()}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Approve plan
                </Button>
              )}

              {needsFeedback && (
                <div className="flex gap-2">
                  <Input
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Reply to Jules…"
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && followUp.trim()) {
                        void agent.sendMessage(followUp);
                        setFollowUp("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => {
                      void agent.sendMessage(followUp);
                      setFollowUp("");
                    }}
                  >
                    Send
                  </Button>
                </div>
              )}

              {/* Activity feed */}
              {agent.activities.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Activity</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {agent.activities.slice(-12).map((act, i) => (
                      <div key={act.id ?? act.name ?? i} className="text-[11px] px-2 py-1 rounded bg-muted/20">
                        <span className="text-violet-400/80">{act.originator === "user" ? "You" : "Jules"}</span>
                        {" — "}
                        {act.progressUpdated?.title ??
                          act.planGenerated?.plan?.steps?.[0]?.title ??
                          "Working…"}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {agent.pendingChanges.length > 0 && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-2">
                  <p className="text-xs font-medium text-emerald-400">
                    {agent.pendingChanges.length} file change{agent.pendingChanges.length === 1 ? "" : "s"} ready
                  </p>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5">
                    {agent.pendingChanges.map((c) => (
                      <li key={c.path}>
                        {c.isNew ? "+ " : "~ "}
                        {c.path}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className="w-full h-8 gap-1" onClick={handleApply}>
                    <Play className="h-3.5 w-3.5" /> Apply to workspace
                  </Button>
                </div>
              )}
            </div>
          )}

          {agent.error && (
            <p className="text-[11px] text-red-400 px-2">{agent.error}</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
