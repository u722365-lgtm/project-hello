#!/usr/bin/env node
/**
 * Generate TTS voiceover MP3s for Remotion viral shorts (edge-tts, no API key).
 * Output: remotion/public/audio/{variant}/{scene}.mp3
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(root, "remotion", "public", "audio");
const VOICE = process.env.VIRAL_TTS_VOICE ?? "en-US-AndrewNeural";

const SCRIPTS = {
  privacy: {
    hook: "Stop. Before you send one more message to ChatGPT… watch this.",
    pain: "Every prompt you type — your ideas, your code, your secrets — can live on someone else's server forever. Not paranoia. Architecture.",
    twist: "So we built the opposite. ShadowTalk AI. Private. Encrypted. Think AI — without broadcasting your brain to the internet.",
    proof: "Watch this. Same power. None of the exposure. Try it in ten seconds at shadowtalk-ai.com.",
    share: "If you wouldn't read your journal out loud in a coffee shop… why are you doing it in a chat box? Tag one person who still uses normal AI for private stuff. Send this to them. Seriously.",
    cta: "Link in bio. ShadowTalk AI. Think AI. Think ShadowTalk. Free to try.",
    loop: "Comment SHADOW if you want Part 2.",
  },
  developer: {
    hook: "Developers — you pasted secrets into ChatGPT. Here's what that actually means.",
    pain: "That dot env paste? It's not ephemeral. API keys get cached. Tokens end up in logs. And there's real training-data risk.",
    twist: "So we built the opposite. ShadowTalk AI. Encrypted chat for the stuff you should never put in a public model.",
    proof: "Watch this. Draft code and configs without shipping your keys to the cloud. shadowtalk-ai.com.",
    share: "If you wouldn't commit secrets to GitHub… why paste them into ChatGPT? Tag a dev who still pastes env files into AI.",
    cta: "ShadowTalk AI. Think AI. Think ShadowTalk. Free to try.",
    loop: "Comment SHADOW for the dev security deep-dive.",
  },
  student: {
    hook: "Students — every essay you paste in might be training someone else's model.",
    pain: "Your homework can be retained. Your writing style copied. And there's often no real opt-out.",
    twist: "So we built the opposite. ShadowTalk AI. Private AI for drafts, research, and ideas that are actually yours.",
    proof: "Watch this. Same help. None of the exposure. Try shadowtalk-ai.com.",
    share: "If you wouldn't hand your essay to a stranger… why upload it to a chatbot? Tag a friend who writes papers in ChatGPT.",
    cta: "ShadowTalk AI. Think AI. Think ShadowTalk. Free to try.",
    loop: "Comment SHADOW if you want the student privacy guide.",
  },
};

function edgeTtsBin() {
  const local = join(process.env.HOME ?? "", ".local", "bin", "edge-tts");
  if (existsSync(local)) return local;
  const r = spawnSync("which", ["edge-tts"], { encoding: "utf8" });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  return null;
}

function generateScene(bin, variant, scene, text) {
  const dir = join(publicRoot, variant);
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${scene}.mp3`);
  console.log(`  • ${variant}/${scene}.mp3`);
  const r = spawnSync(
    bin,
    ["--voice", VOICE, "--text", text, "--write-media", out],
    { stdio: "inherit" },
  );
  if (r.status !== 0) {
    console.error(`Failed: ${variant}/${scene}`);
    process.exit(r.status ?? 1);
  }
}

const variants = process.argv.slice(2);
const targetVariants = variants.length > 0 ? variants : ["privacy"];

const bin = edgeTtsBin();
if (!bin) {
  console.error("edge-tts not found. Install: pip3 install edge-tts");
  console.error("Then ensure ~/.local/bin is on PATH, or re-run after install.");
  process.exit(1);
}

console.log(`Voice: ${VOICE}\n`);

for (const variant of targetVariants) {
  const scenes = SCRIPTS[variant];
  if (!scenes) {
    console.error(`Unknown variant: ${variant}`);
    process.exit(1);
  }
  console.log(`▶ ${variant}`);
  for (const [scene, text] of Object.entries(scenes)) {
    generateScene(bin, variant, scene, text);
  }
}

console.log("\n✓ Voiceover files ready in remotion/public/audio/");
