import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingShape({ position, color, geometry, scale = 1, opacity = 1 }: { position: [number, number, number], color: string, geometry: "sphere" | "box", scale?: number, opacity?: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    mesh.current.rotation.x = clock.getElapsedTime() / 2;
    mesh.current.rotation.y = clock.getElapsedTime() / 2;
    mesh.current.position.y = position[1] + Math.sin(clock.getElapsedTime() + position[0]) * 0.2 * scale;
  });
  return (
    <mesh ref={mesh} position={position} scale={scale} castShadow receiveShadow>
      {geometry === "sphere" ? <sphereGeometry args={[0.5, 32, 32]} /> : <boxGeometry args={[0.7, 0.7, 0.7]} />}
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} transparent opacity={opacity} />
    </mesh>
  );
}

export default function FloatingShapes3D({ subtle }: { subtle?: boolean }) {
  // Subtle mode: smaller, higher, more transparent
  const scale = subtle ? 0.7 : 1;
  const opacity = subtle ? 0.5 : 1;
  const yOffset = subtle ? 2 : 0;
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 50 }} style={{ width: "100vw", height: "100vh" }} gl={{ alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      <FloatingShape position={[-2, 1 + yOffset, 0]} color="#6366f1" geometry="sphere" scale={scale} opacity={opacity} />
      <FloatingShape position={[2, -1 + yOffset, 0]} color="#14b8a6" geometry="box" scale={scale} opacity={opacity} />
      <FloatingShape position={[0, 2 + yOffset, -1]} color="#f59e42" geometry="sphere" scale={scale} opacity={opacity} />
      <FloatingShape position={[-1.5, -1.5 + yOffset, 1]} color="#a21caf" geometry="box" scale={scale} opacity={opacity} />
      <FloatingShape position={[1.5, 1.5 + yOffset, -1]} color="#0ea5e9" geometry="sphere" scale={scale} opacity={opacity} />
    </Canvas>
  );
} 