import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, Line, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface NeuralCanvasModeProps {
  messages: any[];
}

const getSpherePosition = (index: number, total: number) => {
  const phi = Math.acos(-1 + (2 * index) / total);
  const theta = Math.sqrt(total * Math.PI) * phi;
  // Use a pseudo-random but deterministic radius between 10 and 15
  const pseudoRandom = Math.abs((Math.sin(index * 12.9898) * 43758.5453) % 1);
  const radius = 10 + (pseudoRandom * 8); // more variation
  
  return new THREE.Vector3(
    radius * Math.cos(theta) * Math.sin(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(phi)
  );
};

const MemoryNode = ({ message, index, total }: { message: any; index: number; total: number }) => {
  const ref = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  
  const position = useMemo(() => getSpherePosition(index, total), [index, total]);
  const isUser = message.type === 'user';

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={position}>
      <group ref={ref}>
        <Sphere ref={sphereRef} args={[0.6, 32, 32]}>
          <MeshDistortMaterial 
            color={isUser ? "#4f46e5" : "#10b981"} 
            attach="material" 
            distort={0.4} 
            speed={2} 
            roughness={0} 
            metalness={0.8} 
            transparent 
            opacity={0.8} 
          />
        </Sphere>
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={6}
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content}
        </Text>
      </group>
    </Float>
  );
};

const Constellations = ({ messages }: { messages: any[] }) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const total = Math.max(messages.length, 10);
    for (let index = 0; index < messages.length; index++) {
      pts.push(getSpherePosition(index, total));
    }
    return pts;
  }, [messages]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color="#6366f1"
      opacity={0.3}
      transparent
      lineWidth={1}
    />
  );
};

export const NeuralCanvasMode = ({ messages }: NeuralCanvasModeProps) => {
  // Filter out the welcome message for the 3D space
  const displayMessages = messages.filter(m => m.id !== 'welcome');
  const total = Math.max(displayMessages.length, 10); // Ensure spread even for few messages

  return (
    <div className="w-full h-full relative bg-black overflow-hidden rounded-md border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.15)] flex-1 min-h-[400px]">
      <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
        <color attach="background" args={['#030308']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#818cf8" />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#34d399" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {displayMessages.map((msg, idx) => (
          <MemoryNode key={msg.id} message={msg} index={idx} total={total} />
        ))}
        
        <Constellations messages={displayMessages} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxDistance={100}
          minDistance={5}
        />
      </Canvas>
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-sm">
          Neural Canvas
        </h2>
        <p className="text-sm text-indigo-200/60 font-mono mt-1 tracking-wider uppercase">
          {displayMessages.length} / ∞ Memory Clusters Active
        </p>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-indigo-300/40 text-xs tracking-[0.2em] uppercase font-mono">
        Drag to navigate space • Scroll to zoom
      </div>
    </div>
  );
};
