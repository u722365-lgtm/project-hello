import { lazy, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { useEnable3D, use3DQuality } from "@/hooks/useEnable3D";
import { cn } from "@/lib/utils";

const NeuralGlobeScene = lazy(() =>
  import("./NeuralGlobeScene").then((m) => ({ default: m.NeuralGlobeScene })),
);
const CyberGlobeScene = lazy(() =>
  import("./CyberGlobeScene").then((m) => ({ default: m.CyberGlobeScene })),
);

function SceneFallback({ variant }: { variant: "neural" | "cyber" }) {
  const style =
    variant === "cyber"
      ? {
          background:
            "radial-gradient(ellipse 70% 55% at 50% 35%, hsl(0 84% 60% / 0.18), transparent 65%), radial-gradient(ellipse 50% 40% at 70% 60%, hsl(38 92% 50% / 0.1), transparent 55%)",
        }
      : {
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, hsl(239 84% 67% / 0.22), transparent 65%), radial-gradient(ellipse 50% 45% at 30% 55%, hsl(187 92% 50% / 0.12), transparent 55%)",
        };
  return <div className="absolute inset-0 opacity-70" style={style} aria-hidden />;
}

function SceneCanvas({
  variant,
  quality,
}: {
  variant: "neural" | "cyber";
  quality: ReturnType<typeof use3DQuality>;
}) {
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0, 6.5], fov: 42 }}
      dpr={quality === "high" ? [1, 2] : [1, 1.25]}
      gl={{ alpha: true, antialias: quality === "high", powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        {variant === "neural" ? (
          <NeuralGlobeScene quality={quality} />
        ) : (
          <CyberGlobeScene quality={quality} />
        )}
      </Suspense>
    </Canvas>
  );
}

export function Scene3DBackdrop({
  variant,
  className,
  children,
}: {
  variant: "neural" | "cyber";
  className?: string;
  children?: ReactNode;
}) {
  const enabled = useEnable3D();
  const quality = use3DQuality();

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)} aria-hidden>
      {enabled ? (
        <Suspense fallback={<SceneFallback variant={variant} />}>
          <SceneCanvas variant={variant} quality={quality} />
        </Suspense>
      ) : (
        <SceneFallback variant={variant} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background/70" />
      {children}
    </div>
  );
}

export function NeuralGlobeBackdrop(props: Omit<Parameters<typeof Scene3DBackdrop>[0], "variant">) {
  return <Scene3DBackdrop variant="neural" {...props} />;
}

export function CyberGlobeBackdrop(props: Omit<Parameters<typeof Scene3DBackdrop>[0], "variant">) {
  return <Scene3DBackdrop variant="cyber" {...props} />;
}
