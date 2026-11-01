"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MAP_LAYOUT } from "./sceneState";
import { useShadowClone } from "./useModel";

const CANDLE_PATH = "/assets/models/wooden_candlestick/wooden_candlestick_1k.gltf";

function RealCandle({
  position,
  rotation = [0, 0, 0],
  scale = 1.15,
  lightBoost = 1,
  cast = false,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  lightBoost?: number;
  cast?: boolean;
}) {
  const root = useShadowClone(CANDLE_PATH, { matte: true, roughnessBoost: 0.1 });
  const key = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);

  // Candlestick model is ~0.22m tall; flame sits just above the wax tip
  const flameY = 0.225;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + position[0] * 2.5 + position[2];
    const flicker =
      0.82 + Math.sin(t * 7.5) * 0.1 + Math.sin(t * 16) * 0.05 + Math.sin(t * 29) * 0.03;
    if (key.current) key.current.intensity = 1.65 * lightBoost * flicker;
    if (flame.current) {
      flame.current.scale.set(
        0.85 + Math.sin(t * 15) * 0.15,
        0.9 + Math.sin(t * 12) * 0.2,
        0.85,
      );
      flame.current.position.y = flameY + Math.sin(t * 10) * 0.003;
    }
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(t * 8) * 0.1);
  });

  const clone = useMemo(() => root.clone(true), [root]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clone} />
      <mesh ref={flame} position={[0, flameY, 0]}>
        <coneGeometry args={[0.008, 0.028, 8, 1, true]} />
        <meshStandardMaterial
          color="#ffe6a0"
          emissive="#ffb040"
          emissiveIntensity={5}
          toneMapped={false}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={glow} position={[0, flameY + 0.01, 0]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshBasicMaterial color="#ffb050" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <pointLight
        ref={key}
        position={[0, flameY + 0.03, 0]}
        color="#ffb56a"
        intensity={1.65 * lightBoost}
        distance={4.5}
        decay={2}
        castShadow={cast}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
    </group>
  );
}

export function Candles() {
  const y = MAP_LAYOUT.position[1];
  return (
    <group>
      <RealCandle
        position={[-0.78, y, 0.42]}
        rotation={[0, 0.6, 0]}
        scale={1.25}
        lightBoost={1.2}
        cast
      />
      <RealCandle
        position={[0.82, y, 0.35]}
        rotation={[0, -0.9, 0]}
        scale={1.15}
        lightBoost={1.05}
      />
      <RealCandle
        position={[0.2, y, -0.42]}
        rotation={[0, 0.2, 0]}
        scale={1.05}
        lightBoost={0.8}
      />
    </group>
  );
}

useGLTF.preload(CANDLE_PATH);
