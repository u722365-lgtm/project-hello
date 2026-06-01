export const SHADOWTALK_MODEL_DB = "shadowtalk-sovereign-model";
export const CORPUS_STORE = "corpus";
export const META_STORE = "meta";
export const META_KEY = "state";

export interface CorpusItem {
  id: string;
  text: string;
  embedding: number[];
  role: "user" | "assistant";
  createdAt: number;
  clusterId?: number;
}

export interface TopicCluster {
  id: number;
  label: string;
  centroid: number[];
  size: number;
  sampleText: string;
}

export interface ShadowTalkModelState {
  version: 1;
  /** Starts empty — “untrained” until first training cycle */
  trainingGeneration: number;
  corpusCount: number;
  lastTrainedAt: string | null;
  lastIngestAt: string | null;
  clusters: TopicCluster[];
  /** Unsupervised summary injected into chat */
  systemHint: string;
  status: "untrained" | "learning" | "ready";
}

export const EMPTY_MODEL_STATE: ShadowTalkModelState = {
  version: 1,
  trainingGeneration: 0,
  corpusCount: 0,
  lastTrainedAt: null,
  lastIngestAt: null,
  clusters: [],
  systemHint: "",
  status: "untrained",
};
