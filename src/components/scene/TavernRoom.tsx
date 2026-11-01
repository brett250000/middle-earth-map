"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { usePbrMaps } from "./usePbrMaps";

/** Stone tavern hall with timber beams — PBR textures. */
export function TavernRoom() {
  const floor = usePbrMaps("/assets/wood-floor", 4, 4);
  const stone = usePbrMaps("/assets/stone-brick", 3.5, 1.8);
  const beams = usePbrMaps("/assets/ceiling-wood", 1.8, 0.4);
  const floorN = useMemo(() => new THREE.Vector2(1.3, 1.3), []);
  const stoneN = useMemo(() => new THREE.Vector2(1.4, 1.4), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial
          map={floor.map}
          normalMap={floor.normalMap}
          roughnessMap={floor.roughnessMap}
          aoMap={floor.aoMap}
          normalScale={floorN}
          roughness={1}
          metalness={0}
          color="#5a4838"
          envMapIntensity={0.15}
        />
      </mesh>

      <mesh position={[0, 1.8, -3.35]} receiveShadow>
        <planeGeometry args={[12, 3.8]} />
        <meshStandardMaterial
          map={stone.map}
          normalMap={stone.normalMap}
          roughnessMap={stone.roughnessMap}
          aoMap={stone.aoMap}
          normalScale={stoneN}
          roughness={0.98}
          color="#9a8a7c"
          envMapIntensity={0.2}
        />
      </mesh>

      <mesh position={[-5.2, 1.8, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 3.8]} />
        <meshStandardMaterial
          map={stone.map}
          normalMap={stone.normalMap}
          roughnessMap={stone.roughnessMap}
          color="#8a7a6c"
          roughness={0.98}
          envMapIntensity={0.15}
        />
      </mesh>
      <mesh position={[5.2, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 3.8]} />
        <meshStandardMaterial
          map={stone.map}
          normalMap={stone.normalMap}
          roughnessMap={stone.roughnessMap}
          color="#8a7a6c"
          roughness={0.98}
          envMapIntensity={0.15}
        />
      </mesh>

      <mesh position={[0, 3.35, -0.2]} receiveShadow>
        <boxGeometry args={[11, 0.14, 8]} />
        <meshStandardMaterial
          map={beams.map}
          roughnessMap={beams.roughnessMap}
          color="#2a1e16"
          roughness={1}
          envMapIntensity={0.08}
        />
      </mesh>

      {[-2.6, -0.9, 0.9, 2.6].map((x) => (
        <mesh key={x} position={[x, 3.12, -0.1]} castShadow>
          <boxGeometry args={[0.22, 0.28, 7.2]} />
          <meshStandardMaterial
            map={beams.map}
            normalMap={beams.normalMap}
            color="#3a281c"
            roughness={1}
            envMapIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}
