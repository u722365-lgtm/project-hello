import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { runCompletion } from "../completion.js";
import type { ChatMessage } from "../ollama.js";

export function registerChatCommand(program: Command): void {
  program
    .command("chat [message...]")
    .description("Chat with ShadowTalk (local Ollama by default)")
    .option("-i, --interactive", "Interactive REPL")
    .option("-f, --file <path>", "Attach a file to the prompt")
    .option("--no-stream", "Wait for full response before printing")
    .option("--allow-cloud", "Allow cloud AI (requires opt-in in config)")
    .option("--system <prompt>", "System prompt override")
    .action(async (messageParts: string[], opts) => {
      const history: ChatMessage[] = [];
      if (opts.system) {
        history.push({ role: "system", content: opts.system });
      } else {
        history.push({
          role: "system",
          content:
            "You are ShadowTalk, a helpful sovereign AI assistant. Be concise and practical.",
        });
      }

      const runOnce = async (userText: string) => {
        let content = userText;
        if (opts.file) {
          const fileContent = readFileSync(opts.file, "utf8");
          content = `${userText}\n\n--- ${opts.file} ---\n${fileContent}`;
        }
        history.push({ role: "user", content });

        if (opts.stream !== false) {
          process.stdout.write("\n");
        }

        const reply = await runCompletion({
          messages: [...history],
          stream: opts.stream !== false,
          allowCloud: opts.allowCloud,
          onToken: (t) => process.stdout.write(t),
        });

        if (opts.stream === false) {
          console.log(reply);
        } else {
          console.log("\n");
        }

        history.push({ role: "assistant", content: reply });
        return reply;
      };

      const oneShot = messageParts.join(" ").trim();

      if (opts.interactive || (!oneShot && !opts.file)) {
        const rl = createInterface({ input, output });
        console.log("ShadowTalk CLI — device-first chat. Type /exit to quit.\n");
        while (true) {
          const line = await rl.question("you> ");
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "/exit" || trimmed === "/quit") break;
          try {
            await runOnce(trimmed);
          } catch (e) {
            console.error("\nError:", e instanceof Error ? e.message : e);
          }
        }
        rl.close();
        return;
      }

      if (!oneShot && opts.file) {
        await runOnce("Analyze the attached file.");
        return;
      }

      if (!oneShot) {
        console.error("Provide a message or use --interactive");
        process.exit(1);
      }

      try {
        await runOnce(oneShot);
      } catch (e) {
        console.error("Error:", e instanceof Error ? e.message : e);
        process.exit(1);
      }
    });
}
