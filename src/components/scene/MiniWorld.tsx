"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MAP_LAYOUT, sceneControls } from "./sceneState";

type Peak = { x: number; z: number; h: number; r: number };
type Grove = { x: number; z: number; n: number; spread: number };

/** Stylized 3D relief sitting on the atlas — floods with the drowning. */
export function MiniWorld() {
  const beleriand = useRef<THREE.Group>(null);
  const middleEarth = useRef<THREE.Group>(null);

  const belPeaks: Peak[] = useMemo(
    () => [
      { x: -0.35, z: -0.28, h: 0.09, r: 0.06 },
      { x: -0.15, z: -0.32, h: 0.07, r: 0.05 },
      { x: 0.05, z: -0.3, h: 0.08, r: 0.055 },
      { x: 0.42, z: -0.1, h: 0.11, r: 0.045 },
      { x: 0.45, z: 0.05, h: 0.1, r: 0.04 },
      { x: 0.48, z: 0.2, h: 0.09, r: 0.04 },
      { x: 0.0, z: -0.12, h: 0.1, r: 0.05 },
    ],
    [],
  );

  const midPeaks: Peak[] = useMemo(
    () => [
      { x: -0.05, z: -0.25, h: 0.1, r: 0.04 },
      { x: -0.02, z: -0.05, h: 0.12, r: 0.045 },
      { x: 0.0, z: 0.15, h: 0.11, r: 0.04 },
      { x: 0.02, z: 0.32, h: 0.09, r: 0.035 },
      { x: 0.35, z: -0.28, h: 0.08, r: 0.04 },
      { x: 0.08, z: 0.28, h: 0.07, r: 0.05 },
    ],
    [],
  );

  const belGroves: Grove[] = useMemo(
    () => [
      { x: -0.05, z: 0.05, n: 18, spread: 0.16 },
      { x: -0.28, z: 0.12, n: 10, spread: 0.1 },
      { x: 0.35, z: 0.08, n: 12, spread: 0.11 },
    ],
    [],
  );

  const midGroves: Grove[] = useMemo(
    () => [
      { x: 0.22, z: -0.08, n: 22, spread: 0.15 },
      { x: -0.02, z: 0.12, n: 8, spread: 0.08 },
      { x: -0.32, z: -0.05, n: 6, spread: 0.07 },
    ],
    [],
  );

  useFrame(() => {
    const morph = sceneControls.mapMorph;
    const flood = sceneControls.flood;
    if (beleriand.current) {
      // Sink and fade as waters rise / age turns
      const sink = flood * 0.08 + morph * 0.04;
      beleriand.current.position.y = -sink;
      beleriand.current.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (!mat) return;
        mat.transparent = true;
        mat.opacity = Math.max(0, 1 - morph * 1.2 - flood * 0.35);
        mat.visible = mat.opacity > 0.02;
      });
    }
    if (middleEarth.current) {
      const rise = morph * 0.02;
      middleEarth.current.position.y = -0.03 + rise;
      middleEarth.current.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (!mat) return;
        mat.transparent = true;
        mat.opacity = Math.min(1, Math.max(0, morph * 1.3 - 0.15));
        mat.visible = mat.opacity > 0.02;
      });
    }
  });

  return (
    <group position={MAP_LAYOUT.position}>
      <group ref={beleriand}>
        {belPeaks.map((p, i) => (
          <mesh key={`bp-${i}`} position={[p.x, p.h * 0.5, p.z]} castShadow>
            <coneGeometry args={[p.r, p.h, 7]} />
            <meshStandardMaterial color="#8a8680" roughness={0.95} />
          </mesh>
        ))}
        {belPeaks.map((p, i) => (
          <mesh key={`bs-${i}`} position={[p.x, p.h * 0.85, p.z]} castShadow>
            <coneGeometry args={[p.r * 0.45, p.h * 0.35, 6]} />
            <meshStandardMaterial color="#e8e4dc" roughness={0.85} />
          </mesh>
        ))}
        {belGroves.map((g, gi) =>
          Array.from({ length: g.n }).map((_, i) => {
            const a = (i / g.n) * Math.PI * 2 + gi;
            const r = (i % 5) * 0.018 * g.spread * 8;
            return (
              <mesh
                key={`bg-${gi}-${i}`}
                position={[g.x + Math.cos(a) * r, 0.025, g.z + Math.sin(a) * r]}
                castShadow
              >
                <coneGeometry args={[0.012, 0.04 + (i % 3) * 0.01, 5]} />
                <meshStandardMaterial color="#2a4a30" roughness={1} />
              </mesh>
            );
          }),
        )}
      </group>

      <group ref={middleEarth}>
        {midPeaks.map((p, i) => (
          <mesh key={`mp-${i}`} position={[p.x, p.h * 0.5, p.z]} castShadow>
            <coneGeometry args={[p.r, p.h, 7]} />
            <meshStandardMaterial color="#7a7670" roughness={0.95} />
          </mesh>
        ))}
        {midPeaks.slice(0, 4).map((p, i) => (
          <mesh key={`ms-${i}`} position={[p.x, p.h * 0.85, p.z]} castShadow>
            <coneGeometry args={[p.r * 0.4, p.h * 0.3, 6]} />
            <meshStandardMaterial color="#ddd8ce" roughness={0.85} />
          </mesh>
        ))}
        {midGroves.map((g, gi) =>
          Array.from({ length: g.n }).map((_, i) => {
            const a = (i / g.n) * Math.PI * 2 + gi * 0.7;
            const r = (i % 5) * 0.016 * g.spread * 8;
            return (
              <mesh
                key={`mg-${gi}-${i}`}
                position={[g.x + Math.cos(a) * r, 0.025, g.z + Math.sin(a) * r]}
                castShadow
              >
                <coneGeometry args={[0.011, 0.038 + (i % 3) * 0.01, 5]} />
                <meshStandardMaterial color="#1e3a28" roughness={1} />
              </mesh>
            );
          }),
        )}
        {/* Mordor ash cone */}
        <mesh position={[0.38, 0.04, 0.28]} castShadow>
          <coneGeometry args={[0.05, 0.08, 6]} />
          <meshStandardMaterial color="#3a2a28" roughness={1} emissive="#4a2010" emissiveIntensity={0.35} />
        </mesh>
      </group>
    </group>
  );
}
