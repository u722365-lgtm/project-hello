export type JulesSessionState =
  | "QUEUED"
  | "PLANNING"
  | "AWAITING_PLAN_APPROVAL"
  | "AWAITING_USER_FEEDBACK"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | string;

export interface JulesSource {
  name: string;
  id?: string;
  githubRepo?: {
    owner: string;
    repo: string;
    isPrivate?: boolean;
  };
}

export interface JulesGitPatch {
  unidiffPatch?: string;
  baseCommitId?: string;
  suggestedCommitMessage?: string;
}

export interface JulesArtifact {
  changeSet?: {
    source?: string;
    gitPatch?: JulesGitPatch;
  };
  bashOutput?: {
    command?: string;
    output?: string;
    exitCode?: number;
  };
  media?: {
    mimeType?: string;
    data?: string;
  };
}

export interface JulesActivity {
  id?: string;
  name?: string;
  createTime?: string;
  originator?: "agent" | "user" | string;
  progressUpdated?: {
    title?: string;
    description?: string;
  };
  planGenerated?: {
    plan?: {
      id?: string;
      steps?: Array<{ id?: string; title?: string; index?: number }>;
    };
  };
  sessionCompleted?: Record<string, never>;
  artifacts?: JulesArtifact[];
}

export interface JulesSession {
  name?: string;
  id?: string;
  title?: string;
  prompt?: string;
  state?: JulesSessionState;
  url?: string;
  createTime?: string;
  updateTime?: string;
  outputs?: Array<{
    pullRequest?: {
      url?: string;
      title?: string;
      description?: string;
    };
  }>;
}

export interface JulesWorkspaceFile {
  name: string;
  content: string;
  language?: string;
}

export interface ParsedFileChange {
  path: string;
  content: string;
  isNew: boolean;
}

export type JulesIdeMode = "workspace" | "github";
