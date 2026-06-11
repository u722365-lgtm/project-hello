import type { Command } from "commander";
import { loadConfig, setConfigValue, saveConfig } from "../config.js";
import { probeOllamaStatus, pullOllamaModel } from "../ollama.js";

export function registerOllamaCommand(program: Command): void {
  const ollama = program.command("ollama").description("Manage local Ollama inference");

  ollama
    .command("status")
    .description("Check Ollama connectivity and models")
    .action(async () => {
      const cfg = loadConfig();
      const status = await probeOllamaStatus();
      console.log(JSON.stringify({ config: cfg.ollama, status }, null, 2));
      process.exit(status.reachable ? 0 : 1);
    });

  ollama
    .command("pull <model>")
    .description("Pull an Ollama model")
    .action(async (model: string) => {
      console.log(`Pulling ${model}…`);
      const result = await pullOllamaModel(model, (status, pct) => {
        const line = pct !== undefined ? `${status} (${pct}%)` : status;
        process.stderr.write(`\r${line}`.padEnd(60));
      });
      process.stderr.write("\n");
      if (!result.ok) {
        console.error("Pull failed:", result.error);
        process.exit(1);
      }
      setConfigValue("ollama.model", model);
      console.log(`Model ready: ${model}`);
    });

  ollama
    .command("use <model>")
    .description("Set default Ollama model")
    .action((model: string) => {
      const cfg = loadConfig();
      cfg.ollama.model = model;
      saveConfig(cfg);
      console.log(`Default model: ${model}`);
    });

  ollama
    .command("url <baseUrl>")
    .description("Set Ollama base URL")
    .action((baseUrl: string) => {
      const cfg = loadConfig();
      cfg.ollama.url = baseUrl.replace(/\/$/, "");
      saveConfig(cfg);
      console.log(`Ollama URL: ${cfg.ollama.url}`);
    });
}
