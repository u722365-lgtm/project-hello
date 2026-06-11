import type { Command } from "commander";
import { loadConfig } from "../config.js";
import { canUseCloudAI, isDeviceOnlyPledgeActive } from "../pledge.js";
import { decideRoute } from "../router.js";
import { probeOllamaStatus } from "../ollama.js";

export function registerSovereignCommand(program: Command): void {
  program
    .command("sovereign")
    .description("Show sovereign / device-only status")
    .action(async () => {
      const cfg = loadConfig();
      const ollama = await probeOllamaStatus();
      const route = await decideRoute([{ role: "user", content: "ping" }]);

      console.log(
        JSON.stringify(
          {
            pledge: {
              deviceOnly: isDeviceOnlyPledgeActive(),
              cloudAllowed: canUseCloudAI(),
            },
            routing: cfg.routing,
            sovereign: cfg.sovereign,
            ollama: {
              url: cfg.ollama.url,
              model: cfg.ollama.model,
              reachable: ollama.reachable,
              activeModel: ollama.activeModel,
              models: ollama.models,
            },
            nextChatRoute: route,
          },
          null,
          2,
        ),
      );
    });
}
