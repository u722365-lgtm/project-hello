import type { Command } from "commander";
import { getConfigPath, getConfigValue, loadConfig, setConfigValue } from "../config.js";

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("Read/write ~/.shadowtalk/config.json");

  config
    .command("path")
    .description("Print config file path")
    .action(() => {
      console.log(getConfigPath());
    });

  config
    .command("list")
    .description("Show full config")
    .action(() => {
      console.log(JSON.stringify(loadConfig(), null, 2));
    });

  config
    .command("get <key>")
    .description("Get a config value (dot path, e.g. ollama.model)")
    .action((key: string) => {
      const val = getConfigValue(key);
      if (val === undefined) {
        console.error(`Unknown key: ${key}`);
        process.exit(1);
      }
      console.log(typeof val === "object" ? JSON.stringify(val, null, 2) : String(val));
    });

  config
    .command("set <key> <value>")
    .description("Set a config value")
    .action((key: string, value: string) => {
      let parsed: unknown = value;
      if (value === "true") parsed = true;
      else if (value === "false") parsed = false;
      else if (/^\d+$/.test(value)) parsed = Number(value);
      else if (value.startsWith("{") || value.startsWith("[")) {
        try {
          parsed = JSON.parse(value);
        } catch {
          // keep string
        }
      }
      setConfigValue(key, parsed);
      console.log(`Set ${key}`);
    });
}
