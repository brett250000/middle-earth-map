"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useShadowClone } from "./useModel";

const HEATER_PATH =
  "/assets/models/scandinavian_masonry_heater/scandinavian_masonry_heater_1k.gltf";
const PIT_PATH = "/assets/models/stone_fire_pit/stone_fire_pit_1k.gltf";

function FireVfx() {
  const light = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const c = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker =
      0.84 + Math.sin(t * 5.5) * 0.09 + Math.sin(t * 12.5) * 0.06 + Math.sin(t * 24) * 0.04;
    if (light.current) light.current.intensity = 9 * flicker;
    if (fill.current) fill.current.intensity = 3.2 * flicker;
    if (a.current) {
      a.current.scale.set(1 + Math.sin(t * 8) * 0.1, 1.05 + Math.sin(t * 9) * 0.18, 1);
      a.current.position.y = 0.22 + Math.sin(t * 7) * 0.015;
    }
    if (b.current) {
      b.current.scale.set(0.95 + Math.sin(t * 11) * 0.12, 1 + Math.sin(t * 10) * 0.2, 0.95);
      b.current.position.y = 0.28 + Math.sin(t * 8) * 0.02;
    }
    if (c.current) {
      c.current.position.y = 0.4 + Math.sin(t * 14) * 0.025;
    }
  });

  return (
    <group position={[0.05, 0.35, 0.35]}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 24]} />
        <meshStandardMaterial
          color="#ff5018"
          emissive="#ff3008"
          emissiveIntensity={4}
          toneMapped={false}
          roughness={1}
        />
      </mesh>
      <mesh ref={a} position={[0, 0.22, 0]}>
        <coneGeometry args={[0.11, 0.38, 12, 1, true]} />
        <meshStandardMaterial
          color="#ff6818"
          emissive="#ff4808"
          emissiveIntensity={4.5}
          toneMapped={false}
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={b} position={[0, 0.28, 0]}>
        <coneGeometry args={[0.065, 0.3, 10, 1, true]} />
        <meshStandardMaterial
          color="#ffe08a"
          emissive="#ffc040"
          emissiveIntensity={6}
          toneMapped={false}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={c} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.03, 0.16, 8, 1, true]} />
        <meshStandardMaterial
          color="#ff9040"
          emissive="#ff7018"
          emissiveIntensity={3.5}
          toneMapped={false}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0.4, 0.2]}
        color="#ff8a3a"
        intensity={9}
        distance={10}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
      />
      <pointLight
        ref={fill}
        position={[0.3, 0.7, 0.7]}
        color="#ffb070"
        intensity={3.2}
        distance={7}
        decay={2}
      />
    </group>
  );
}

/** Real masonry heater + fire pit coals — Poly Haven scanned models. */
export function Fireplace() {
  const heater = useShadowClone(HEATER_PATH, { matte: true, roughnessBoost: 0.05 });
  const pit = useShadowClone(PIT_PATH, { matte: true, roughnessBoost: 0.1 });

  return (
    <group position={[-2.05, 0, -2.55]}>
      <primitive object={heater} position={[0, 0, 0]} rotation={[0, 0.35, 0]} />
      {/* Fire pit nestled in front of the heater opening for visible flames */}
      <group position={[0.05, 0.15, 0.55]} scale={0.35}>
        <primitive object={pit} />
      </group>
      <FireVfx />
    </group>
  );
}

useGLTF.preload(HEATER_PATH);
useGLTF.preload(PIT_PATH);
