import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { use3DQuality } from "@/hooks/useEnable3D";

type Quality = ReturnType<typeof use3DQuality>;

function ParticleField({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.8 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#a5b4fc" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function NeuralCore({ quality }: { quality: Quality }) {
  const group = useRef<THREE.Group>(null);
  const detail = quality === "high" ? 2 : 1;

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.08;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[2.1, detail]} />
        <meshStandardMaterial
          color="#6366f1"
          wireframe
          emissive="#4338ca"
          emissiveIntensity={0.55}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh scale={0.72}>
        <icosahedronGeometry args={[2.1, detail]} />
        <meshStandardMaterial
          color="#22d3ee"
          wireframe
          emissive="#0891b2"
          emissiveIntensity={0.35}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#e0e7ff" emissive="#818cf8" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

export function NeuralGlobeScene({ quality }: { quality: Quality }) {
  const particleCount = quality === "high" ? 420 : 180;

  return (
    <>
      <fog attach="fog" args={["#050508", 4, 14]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 4, 8]} intensity={1.4} color="#818cf8" />
      <pointLight position={[-5, -3, 4]} intensity={0.6} color="#22d3ee" />
      <NeuralCore quality={quality} />
      <ParticleField count={particleCount} />
    </>
  );
}
