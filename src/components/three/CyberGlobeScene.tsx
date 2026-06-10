import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { use3DQuality } from "@/hooks/useEnable3D";

type Quality = ReturnType<typeof use3DQuality>;

function ThreatNodes({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2,
        radius: 2.6 + (i % 3) * 0.25,
        speed: 0.25 + (i % 5) * 0.06,
        y: Math.sin(i * 1.7) * 0.8,
      })),
    [count],
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      const n = nodes[i];
      const a = n.angle + t * n.speed;
      child.position.set(Math.cos(a) * n.radius, n.y + Math.sin(t + i) * 0.15, Math.sin(a) * n.radius);
    });
  });

  return (
    <group ref={group}>
      {nodes.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}

function ShieldMesh({ quality }: { quality: Quality }) {
  const ref = useRef<THREE.Mesh>(null);
  const detail = quality === "high" ? 2 : 1;

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.18;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2.3, detail]} />
      <meshStandardMaterial
        color="#f97316"
        wireframe
        emissive="#ea580c"
        emissiveIntensity={0.45}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

export function CyberGlobeScene({ quality }: { quality: Quality }) {
  const nodeCount = quality === "high" ? 14 : 8;

  return (
    <>
      <fog attach="fog" args={["#0a0a0c", 3, 12]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 6, 6]} intensity={1.2} color="#ef4444" />
      <pointLight position={[-4, -2, 5]} intensity={0.5} color="#f59e0b" />
      <ShieldMesh quality={quality} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.65, 0.02, 8, 64]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
      </mesh>
      <ThreatNodes count={nodeCount} />
    </>
  );
}
