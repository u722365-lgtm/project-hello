import type { Command } from "commander";
import { resolve } from "node:path";
import { runCompletion } from "../completion.js";
import { collectWorkspaceFiles, buildWorkspacePrompt } from "../workspace.js";

export function registerIdeCommand(program: Command): void {
  const ide = program.command("ide").description("On-device code assistance");

  ide
    .command("ask <task>")
    .description("Run a coding task against a project directory (local only)")
    .option("-d, --dir <path>", "Project directory", ".")
    .option("-f, --file <name>", "Focus file (relative path)")
    .option("--no-stream", "Print full response at once")
    .action(async (task: string, opts) => {
      const dir = resolve(opts.dir);
      const files = collectWorkspaceFiles(dir);
      if (files.length === 0) {
        console.error(`No readable source files in ${dir}`);
        process.exit(1);
      }

      const prompt = buildWorkspacePrompt(task, files, opts.file);
      const messages = [
        {
          role: "system" as const,
          content:
            "You are a senior engineer. Apply the task to the workspace. Output code or diffs clearly.",
        },
        { role: "user" as const, content: prompt },
      ];

      console.error(`Workspace: ${files.length} files from ${dir}\n`);

      try {
        await runCompletion({
          messages,
          stream: opts.stream !== false,
          allowCloud: false,
          onToken: (t) => process.stdout.write(t),
        });
        if (opts.stream !== false) console.log();
      } catch (e) {
        console.error("Error:", e instanceof Error ? e.message : e);
        process.exit(1);
      }
    });
}
