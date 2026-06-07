/**
 * Manus-style reusable document project context.
 * Stores standards, audience, and last settings so recurring workflows start prepared.
 */

import type { KimiDocumentType, KimiLengthType, KimiToneType } from "@/lib/kimiDocumentGeneration";

export const DOCUMENT_PROJECTS_KEY = "shadowtalk_document_projects";

export interface DocumentForgeProject {
  id: string;
  name: string;
  topic: string;
  docType: KimiDocumentType;
  tone: KimiToneType;
  length: KimiLengthType;
  audience?: string;
  standards?: string;
  enableResearch?: boolean;
  updatedAt: number;
}

export function loadDocumentProjects(): DocumentForgeProject[] {
  try {
    const raw = localStorage.getItem(DOCUMENT_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DocumentForgeProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDocumentProject(project: DocumentForgeProject): void {
  const projects = loadDocumentProjects().filter((p) => p.id !== project.id);
  projects.unshift({ ...project, updatedAt: Date.now() });
  localStorage.setItem(DOCUMENT_PROJECTS_KEY, JSON.stringify(projects.slice(0, 12)));
}

export function upsertDocumentProjectFromRun(input: {
  topic: string;
  docType: KimiDocumentType;
  tone: KimiToneType;
  length: KimiLengthType;
  audience?: string;
  standards?: string;
  enableResearch?: boolean;
}): DocumentForgeProject {
  const name = input.topic.trim().slice(0, 48) || "Untitled document";
  const existing = loadDocumentProjects().find(
    (p) => p.topic === input.topic && p.docType === input.docType,
  );
  const project: DocumentForgeProject = {
    id: existing?.id ?? `doc-${Date.now()}`,
    name,
    updatedAt: Date.now(),
    ...input,
  };
  saveDocumentProject(project);
  return project;
}

export function deleteDocumentProject(id: string): void {
  const next = loadDocumentProjects().filter((p) => p.id !== id);
  localStorage.setItem(DOCUMENT_PROJECTS_KEY, JSON.stringify(next));
}
