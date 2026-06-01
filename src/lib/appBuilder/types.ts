export type AppPlatform = "web" | "mobile";

export interface AppProjectFile {
  name: string;
  language: string;
  content: string;
}

export interface AppProject {
  title: string;
  platform: AppPlatform;
  description?: string;
  files: AppProjectFile[];
}

export interface AppBuilderIntent {
  platform: AppPlatform;
  confidence: number;
}
