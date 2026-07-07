import type { PersonalShadowTalkModel, PersonalTrainingExample } from "./types";
import { DEFAULT_PERSONAL_MODEL, DEFAULT_PERSONAL_MODEL_NAME } from "./types";

const MODELS_KEY = "custom-models";
const ACTIVE_KEY = "active-custom-model";
const MAX_AUTO_EXAMPLES = 40;

function parseModels(raw: string | null): PersonalShadowTalkModel[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PersonalShadowTalkModel[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadPersonalModels(): PersonalShadowTalkModel[] {
  if (typeof localStorage === "undefined") return [];
  return parseModels(localStorage.getItem(MODELS_KEY));
}

export function savePersonalModels(models: PersonalShadowTalkModel[]): void {
  localStorage.setItem(MODELS_KEY, JSON.stringify(models));
}

/** Ensure every user has an active personal ShadowTalk model. */
export function ensureDefaultPersonalModel(): PersonalShadowTalkModel {
  let models = loadPersonalModels();
  if (models.length === 0) {
    models = [{ ...DEFAULT_PERSONAL_MODEL }];
    savePersonalModels(models);
    localStorage.setItem(ACTIVE_KEY, DEFAULT_PERSONAL_MODEL_NAME);
    return models[0];
  }

  const activeName = localStorage.getItem(ACTIVE_KEY);
  const active = models.find((m) => m.name === activeName && m.isActive);
  if (active) return active;

  const fallback = models.find((m) => m.isActive) ?? models[0];
  localStorage.setItem(ACTIVE_KEY, fallback.name);
  const updated = models.map((m) => ({ ...m, isActive: m.name === fallback.name }));
  savePersonalModels(updated);
  return { ...fallback, isActive: true };
}

export function getActivePersonalModel(): PersonalShadowTalkModel | null {
  if (typeof localStorage === "undefined") return null;
  ensureDefaultPersonalModel();
  const models = loadPersonalModels();
  const activeName = localStorage.getItem(ACTIVE_KEY);
  const model = models.find((m) => m.name === activeName) ?? models.find((m) => m.isActive);
  return model?.isActive ? model : null;
}

export function upsertPersonalModel(model: PersonalShadowTalkModel): void {
  const models = loadPersonalModels();
  const idx = models.findIndex((m) => m.name === model.name);
  if (idx >= 0) models[idx] = model;
  else models.push(model);
  savePersonalModels(models);
}

/** Add a training pair from a real chat turn (private, on-device). */
export function learnPersonalExampleFromTurn(
  userMessage: string,
  assistantResponse: string,
): PersonalShadowTalkModel | null {
  const model = getActivePersonalModel();
  if (!model || model.autoLearnFromChat === false) return null;

  const user = userMessage.trim().slice(0, 800);
  const assistant = assistantResponse.trim().slice(0, 1200);
  if (user.length < 8 || assistant.length < 16) return null;

  const duplicate = model.trainingExamples.some(
    (ex) => ex.userMessage.trim().toLowerCase() === user.toLowerCase(),
  );
  if (duplicate) return model;

  const example: PersonalTrainingExample = {
    id: crypto.randomUUID(),
    userMessage: user,
    assistantResponse: assistant,
  };

  let examples = [...model.trainingExamples, example];
  if (examples.length > MAX_AUTO_EXAMPLES) {
    examples = examples.slice(-MAX_AUTO_EXAMPLES);
  }

  const updated = { ...model, trainingExamples: examples };
  upsertPersonalModel(updated);
  if (model.isActive) {
    localStorage.setItem(ACTIVE_KEY, updated.name);
  }
  return updated;
}

export function getPersonalModelSampling(model: PersonalShadowTalkModel | null): {
  temperature: number;
  maxTokens: number;
} {
  if (!model) return { temperature: 0.65, maxTokens: 768 };
  return {
    temperature: Math.min(1, Math.max(0.1, model.temperature)),
    maxTokens: Math.min(4096, Math.max(256, model.maxTokens)),
  };
}
