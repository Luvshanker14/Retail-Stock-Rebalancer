import React from "react";
import { Canvas } from "@react-three/fiber";
import { Stage } from "@react-three/drei";

function GlassCube() {
  return (
    <mesh rotation={[0.4, 0.6, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshPhysicalMaterial
        color="#e0e7ef"
        roughness={0.1}
        metalness={0.7}
        transmission={0.7}
        thickness={0.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

export default function ThreeDStore() {
  return (
    <div style={{ width: 140, height: 140 }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 40 }} shadows>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
        <Stage environment={null} intensity={0.5}>
          <GlassCube />
        </Stage>
      </Canvas>
    </div>
  );
} 