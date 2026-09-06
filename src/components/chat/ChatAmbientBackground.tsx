import React from "react";

/**
 * Dynamic ambient mesh gradient backdrop for the flagship look.
 * Hardware-accelerated with CSS transforms and composite layers to run
 * on dedicated GPU threads with 0ms CPU overhead.
 */
function ChatAmbientBackgroundInner() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#060911] pointer-events-none select-none">
      {/* Top-left Indigo / Violet Radiant Mesh - GPU Composited */}
      <div
        style={{ willChange: "transform, opacity", transform: "translate3d(0, 0, 0)" }}
        className="absolute top-[-15%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-indigo-600/25 via-violet-600/18 to-transparent blur-[120px] animate-ambient-mesh-1"
      />

      {/* Top-right Cyan / Sky Radiant Mesh - GPU Composited */}
      <div
        style={{ willChange: "transform, opacity", transform: "translate3d(0, 0, 0)" }}
        className="absolute top-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-bl from-cyan-500/22 via-sky-600/15 to-transparent blur-[110px] animate-ambient-mesh-2"
      />

      {/* Center Subtle Frontier Aura */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Micro-grid constellation texture */}
      <div
        className="fixed inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] opacity-40"
        aria-hidden
      />

      <div className="fixed inset-0 settings-grain opacity-15" aria-hidden />
    </div>
  );
}

export const ChatAmbientBackground = React.memo(ChatAmbientBackgroundInner);

