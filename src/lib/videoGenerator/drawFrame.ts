import { C } from "./colors";
import { HOOK_VARIANTS, PAIN_COPY, SHARE_LINES } from "./scripts";
import { localFrame, sceneAtFrame, VIDEO_HEIGHT, VIDEO_WIDTH } from "./timing";
import type { VideoHookVariant } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

function drawBackground(ctx: CanvasRenderingContext2D, danger = false, pulse = false, frame = 0) {
  const glow = pulse ? 0.08 + 0.1 * (0.5 + 0.5 * Math.sin(frame / 15)) : 0.12;
  const accent = danger ? "239, 68, 68" : "26, 200, 255";
  const g = ctx.createRadialGradient(
    VIDEO_WIDTH / 2,
    0,
    0,
    VIDEO_WIDTH / 2,
    0,
    VIDEO_WIDTH * 0.9,
  );
  g.addColorStop(0, `rgba(${accent}, ${glow})`);
  g.addColorStop(0.55, "rgba(0,0,0,0)");
  ctx.fillStyle = C.background;
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  opts: {
    size?: number;
    color?: string;
    weight?: string;
    align?: CanvasTextAlign;
    maxWidth?: number;
    opacity?: number;
    glow?: string;
  } = {},
) {
  const {
    size = 48,
    color = C.foreground,
    weight = "700",
    align = "center",
    maxWidth = VIDEO_WIDTH - 80,
    opacity = 1,
    glow,
  } = opts;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = align;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 24;
  }
  const lines = wrapText(ctx, text, maxWidth);
  const lineH = size * 1.2;
  const startY = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, VIDEO_WIDTH / 2, startY + i * lineH));
  ctx.restore();
}

function animIn(local: number, delay = 0): number {
  return clamp((local - delay) / 12, 0, 1);
}

function drawHook(ctx: CanvasRenderingContext2D, variant: VideoHookVariant, local: number) {
  const hook = HOOK_VARIANTS[variant];
  const glitch = local > 45 && local < 55 ? (local % 2 === 0 ? 4 : -4) : 0;
  const flash = local > 50 && local < 60 ? 0.25 : 0;
  drawBackground(ctx, true, true, local);
  if (flash > 0) {
    ctx.fillStyle = `rgba(239,68,68,${flash})`;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  }
  ctx.save();
  ctx.translate(glitch, 0);
  drawTextBlock(ctx, hook.headline, VIDEO_HEIGHT * 0.38, {
    size: 52,
    color: C.destructive,
    opacity: animIn(local, 5),
    glow: C.primary,
  });
  if (hook.subline) {
    drawTextBlock(ctx, hook.subline, VIDEO_HEIGHT * 0.48, {
      size: 28,
      color: C.muted,
      weight: "500",
      opacity: animIn(local, 20),
    });
  }
  drawTextBlock(ctx, hook.voiceover, VIDEO_HEIGHT * 0.58, {
    size: 30,
    weight: "600",
    opacity: animIn(local, 35),
  });
  ctx.restore();
  drawTextBlock(ctx, "▶ Watch before you send", VIDEO_HEIGHT * 0.88, {
    size: 18,
    color: C.muted,
    weight: "500",
    opacity: animIn(local, 60),
  });
}

function drawPain(ctx: CanvasRenderingContext2D, variant: VideoHookVariant, local: number) {
  const copy = PAIN_COPY[variant];
  drawBackground(ctx, true, false, local);
  drawTextBlock(ctx, copy.headline, VIDEO_HEIGHT * 0.22, {
    size: 36,
    opacity: animIn(local, 5),
  });
  drawTextBlock(ctx, "Not paranoia. Architecture.", VIDEO_HEIGHT * 0.32, {
    size: 24,
    color: C.destructive,
    opacity: animIn(local, 40),
  });
  const show = animIn(local, 70);
  if (show <= 0) return;
  const pad = 24;
  const colW = (VIDEO_WIDTH - pad * 3) / 2;
  const top = VIDEO_HEIGHT * 0.4;
  const h = VIDEO_HEIGHT * 0.42;
  [["☁️", "Cloud AI", copy.left, C.destructive] as const, ["🔒", "What you typed", copy.right, C.primary] as const].forEach(
    ([icon, label, items, accent], i) => {
      const x = pad + i * (colW + pad);
      ctx.globalAlpha = show;
      ctx.fillStyle = `${accent}18`;
      ctx.strokeStyle = `${accent}66`;
      ctx.lineWidth = 2;
      roundRect(ctx, x, top, colW, h, 16);
      ctx.fill();
      ctx.stroke();
      ctx.font = "28px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = C.foreground;
      ctx.fillText(icon, x + 16, top + 36);
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillStyle = accent;
      ctx.fillText(label, x + 16, top + 68);
      ctx.font = "16px Inter, sans-serif";
      ctx.fillStyle = C.muted;
      items.forEach((item, j) => ctx.fillText(`• ${item}`, x + 16, top + 100 + j * 28));
      ctx.globalAlpha = 1;
    },
  );
}

function drawTwist(ctx: CanvasRenderingContext2D, local: number) {
  drawBackground(ctx, false, true, local);
  drawTextBlock(ctx, "So we built the opposite.", VIDEO_HEIGHT * 0.28, {
    size: 40,
    opacity: animIn(local, 5),
  });
  const t = animIn(local, 20);
  const grad = ctx.createLinearGradient(0, VIDEO_HEIGHT * 0.38, VIDEO_WIDTH, VIDEO_HEIGHT * 0.48);
  grad.addColorStop(0, C.primary);
  grad.addColorStop(1, C.secondary);
  ctx.save();
  ctx.globalAlpha = t;
  ctx.font = "900 64px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = grad;
  ctx.fillText("ShadowTalk AI", VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.44);
  ctx.restore();
  drawTextBlock(ctx, "Think AI — without broadcasting your brain to the internet.", VIDEO_HEIGHT * 0.54, {
    size: 24,
    color: C.muted,
    weight: "500",
    opacity: animIn(local, 45),
  });
  ["Encrypted chat", "Private by design", "Your keys. Your control."].forEach((f, i) => {
    const o = animIn(local, 60 + i * 15);
    if (o <= 0) return;
    const y = VIDEO_HEIGHT * 0.62 + i * 44;
    ctx.globalAlpha = o;
    ctx.font = "18px monospace";
    const tw = ctx.measureText(f).width + 40;
    const x = (VIDEO_WIDTH - tw) / 2;
    roundRect(ctx, x, y - 22, tw, 36, 18);
    ctx.fillStyle = `${C.primary}22`;
    ctx.strokeStyle = `${C.primary}66`;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.primary;
    ctx.textAlign = "center";
    ctx.fillText(f, VIDEO_WIDTH / 2, y + 2);
    ctx.globalAlpha = 1;
  });
}

function drawProof(ctx: CanvasRenderingContext2D, local: number) {
  drawBackground(ctx, false, false, local);
  drawTextBlock(ctx, "Watch this.", VIDEO_HEIGHT * 0.18, { size: 40, opacity: animIn(local, 5) });
  const t = animIn(local, 25);
  if (t > 0) {
    const pw = VIDEO_WIDTH * 0.72;
    const ph = VIDEO_HEIGHT * 0.42;
    const px = (VIDEO_WIDTH - pw) / 2;
    const py = VIDEO_HEIGHT * 0.26;
    ctx.globalAlpha = t;
    roundRect(ctx, px, py, pw, ph, 28);
    ctx.fillStyle = C.card;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.foreground;
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ShadowTalk", px + 20, py + 40);
    ctx.font = "14px monospace";
    ctx.fillStyle = C.success;
    const badge = "🔒 Encrypted";
    const bw = ctx.measureText(badge).width + 20;
    roundRect(ctx, px + pw - bw - 16, py + 18, bw, 28, 14);
    ctx.fillStyle = `${C.success}22`;
    ctx.fill();
    ctx.fillStyle = C.success;
    ctx.fillText(badge, px + pw - bw - 6, py + 38);
    const msgs = [
      { user: true, text: "Draft my salary negotiation script" },
      { user: false, text: "Here's a confident, private draft — only on your device." },
    ];
    msgs.forEach((m, i) => {
      if (local < 25 + 20 + i * 18) return;
      ctx.font = "15px Inter, sans-serif";
      const mw = pw * 0.75;
      const lines = wrapText(ctx, m.text, mw - 24);
      const mh = lines.length * 20 + 24;
      const mx = m.user ? px + pw - mw - 16 : px + 16;
      const my = py + 70 + i * 90;
      roundRect(ctx, mx, my, mw, mh, 14);
      ctx.fillStyle = m.user ? `${C.primary}33` : `${C.muted}22`;
      ctx.fill();
      ctx.fillStyle = C.foreground;
      ctx.textAlign = "left";
      lines.forEach((ln, j) => ctx.fillText(ln, mx + 12, my + 22 + j * 20));
    });
    ctx.globalAlpha = 1;
  }
  drawTextBlock(ctx, "Same power. None of the exposure.", VIDEO_HEIGHT * 0.74, {
    size: 26,
    color: C.primary,
    opacity: animIn(local, 120),
  });
  drawTextBlock(ctx, "shadowtalk-ai.com", VIDEO_HEIGHT * 0.82, {
    size: 20,
    color: C.muted,
    opacity: animIn(local, 150),
  });
}

function drawShare(ctx: CanvasRenderingContext2D, variant: VideoHookVariant, local: number) {
  const copy = SHARE_LINES[variant];
  drawBackground(ctx, false, true, local);
  drawTextBlock(ctx, copy.quote, VIDEO_HEIGHT * 0.32, {
    size: 30,
    opacity: animIn(local, 10),
  });
  const pulse = 1 + 0.03 * Math.sin(local / 8);
  const t = animIn(local, 40);
  if (t > 0) {
    ctx.save();
    ctx.translate(VIDEO_WIDTH / 2, VIDEO_HEIGHT * 0.55);
    ctx.scale(pulse * t, pulse * t);
    ctx.font = "bold 28px Inter, sans-serif";
    const lines = wrapText(ctx, copy.cta, VIDEO_WIDTH - 120);
    const lh = 34;
    const boxH = lines.length * lh + 40;
    const boxW = VIDEO_WIDTH - 80;
    roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 20);
    ctx.fillStyle = `${C.accent}22`;
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.accent;
    ctx.textAlign = "center";
    lines.forEach((ln, i) => ctx.fillText(ln, 0, -boxH / 2 + 36 + i * lh));
    ctx.restore();
  }
  drawTextBlock(ctx, "Send this to them. Seriously.", VIDEO_HEIGHT * 0.78, {
    size: 24,
    opacity: animIn(local, 80),
  });
}

function drawCta(ctx: CanvasRenderingContext2D, local: number) {
  drawBackground(ctx, false, true, local);
  const t = animIn(local, 0);
  if (t > 0) {
    const glow = 0.5 + 0.3 * Math.sin(local / 12);
    const s = 100;
    const x = VIDEO_WIDTH / 2 - s / 2;
    const y = VIDEO_HEIGHT * 0.3;
    const g = ctx.createLinearGradient(x, y, x + s, y + s);
    g.addColorStop(0, C.primary);
    g.addColorStop(1, C.secondary);
    ctx.globalAlpha = t;
    ctx.shadowColor = C.primary;
    ctx.shadowBlur = 40 * glow;
    roundRect(ctx, x, y, s, s, 24);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = C.background;
    ctx.font = "900 48px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("S", VIDEO_WIDTH / 2, y + 68);
    ctx.globalAlpha = 1;
  }
  drawTextBlock(ctx, "ShadowTalk AI", VIDEO_HEIGHT * 0.48, {
    size: 48,
    opacity: animIn(local, 15),
    glow: C.primary,
  });
  drawTextBlock(ctx, "Think AI. Think ShadowTalk.", VIDEO_HEIGHT * 0.56, {
    size: 26,
    color: C.primary,
    opacity: animIn(local, 35),
  });
  const urlT = animIn(local, 50);
  if (urlT > 0) {
    ctx.globalAlpha = urlT;
    const text = "shadowtalk-ai.com";
    ctx.font = "22px monospace";
    const tw = ctx.measureText(text).width + 48;
    const x = (VIDEO_WIDTH - tw) / 2;
    const y = VIDEO_HEIGHT * 0.64;
    roundRect(ctx, x, y, tw, 44, 12);
    ctx.fillStyle = `${C.primary}22`;
    ctx.strokeStyle = C.primary;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.foreground;
    ctx.textAlign = "center";
    ctx.fillText(text, VIDEO_WIDTH / 2, y + 30);
    ctx.globalAlpha = 1;
  }
  drawTextBlock(ctx, "Free to try", VIDEO_HEIGHT * 0.74, {
    size: 18,
    color: C.muted,
    opacity: animIn(local, 80),
  });
}

function drawLoop(ctx: CanvasRenderingContext2D, local: number) {
  drawBackground(ctx, false, false, local);
  drawTextBlock(ctx, "Part 2: I tested what leaks when you use regular AI 👀", VIDEO_HEIGHT * 0.42, {
    size: 30,
    opacity: animIn(local, 5),
  });
  drawTextBlock(ctx, "Comment SHADOW if you want Part 2.", VIDEO_HEIGHT * 0.54, {
    size: 28,
    color: C.accent,
    opacity: animIn(local, 40),
    glow: C.accent,
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  frame: number,
  variant: VideoHookVariant,
): void {
  ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  const scene = sceneAtFrame(frame);
  const local = localFrame(frame, scene);
  switch (scene) {
    case "hook":
      drawHook(ctx, variant, local);
      break;
    case "pain":
      drawPain(ctx, variant, local);
      break;
    case "twist":
      drawTwist(ctx, local);
      break;
    case "proof":
      drawProof(ctx, local);
      break;
    case "share":
      drawShare(ctx, variant, local);
      break;
    case "cta":
      drawCta(ctx, local);
      break;
    case "loop":
      drawLoop(ctx, local);
      break;
  }
}
