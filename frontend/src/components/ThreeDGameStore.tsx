import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function StoreModel({ onEnter }: { onEnter: () => void }) {
  const group = useRef<any>(null);
  const { scene } = useGLTF("/247_cyberpunk_store/scene.gltf");
  const [entered, setEntered] = useState(false);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);

  React.useEffect(() => {
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            mat.side = THREE.DoubleSide;
            mat.transparent = true;
            mat.opacity = 1;
          });
        } else {
          mesh.material.side = THREE.DoubleSide;
          mesh.material.transparent = false;
          mesh.material.opacity = 1;
        }
      }
    });
  }, [scene]);

  // Remove auto-rotation
  useFrame(() => {
    if (entered) {
      if (camera.position.z > 2) {
        camera.position.z -= 0.5;
        camera.position.y += 0.01;
      } else {
        onEnter();
        setEntered(false);
      }
    }
  });

  // Door clickable area (adjust position/size as needed for your model)
  return (
    <group
      ref={group}
      position={[0, -0, 0]}
      rotation={[0, -Math.PI / 2 - Math.PI / 8, 0]}
      onClick={() => setEntered(true)}
    >
      <primitive object={scene} scale={[0.9, 0.9, 0.9]} />
    </group>
  );
}

export default function ThreeDGameStore({ onEnter }: { onEnter: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 20 }}>
      <Canvas camera={{ position: [0, 1.8, 12], fov: 38, near: 0.1, far: 100 }} shadows style={{ width: "100vw", height: "100vh" }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
        <Suspense fallback={<Html center>Loading 3D Store...</Html>}>
          <StoreModel onEnter={onEnter} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
        />
        <mesh receiveShadow position={[0, 100, 1]}>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#e0f2f1" />
        </mesh>
      </Canvas>
    </div>
  );
}

// Required for GLTF loading
// @ts-ignore
useGLTF.preload && useGLTF.preload("/247_cyberpunk_store/scene.gltf"); 