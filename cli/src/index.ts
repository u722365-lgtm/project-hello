#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerChatCommand } from "./commands/chat.js";
import { registerOllamaCommand } from "./commands/ollama.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerSovereignCommand } from "./commands/sovereign.js";
import { registerIdeCommand } from "./commands/ide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };

const program = new Command();

program
  .name("shadowtalk")
  .description("ShadowTalk CLI — sovereign local-first AI in your terminal")
  .version(pkg.version)
  .addHelpText(
    "after",
    `
Examples:
  st chat "Explain async/await in Node"
  st chat -i
  st ollama status
  st ollama pull qwen2.5:7b
  st ide ask "Add error handling" --dir ./src
  st sovereign
  st config list

Device-only by default — your data stays on this machine.
Cloud requires config set pledge.cloudOptIn true (and pledge.deviceOnly false).
`,
  );

registerChatCommand(program);
registerOllamaCommand(program);
registerConfigCommand(program);
registerSovereignCommand(program);
registerIdeCommand(program);

program.parse(process.argv);
