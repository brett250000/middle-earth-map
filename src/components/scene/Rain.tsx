"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { sceneControls } from "./sceneState";

const STREAK_COUNT = 700;
const SPLASH_COUNT = 70;

export function Rain() {
  const streaks = useRef<THREE.InstancedMesh>(null);
  const splashes = useRef<THREE.InstancedMesh>(null);

  const streakData = useMemo(() => {
    const pos = new Float32Array(STREAK_COUNT * 3);
    const speed = new Float32Array(STREAK_COUNT);
    for (let i = 0; i < STREAK_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = 1.2 + Math.random() * 2.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
      speed[i] = 5 + Math.random() * 6;
    }
    return { pos, speed };
  }, []);

  const splashData = useMemo(() => {
    const life = new Float32Array(SPLASH_COUNT);
    const pos = new Float32Array(SPLASH_COUNT * 3);
    return { life, pos, cursor: 0 };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const intensity = sceneControls.rain;
    const visible = intensity > 0.02;
    if (streaks.current) streaks.current.visible = visible;
    if (splashes.current) splashes.current.visible = visible;
    if (!visible) return;

    const tableY = 0.79;
    if (streaks.current) {
      for (let i = 0; i < STREAK_COUNT; i++) {
        streakData.pos[i * 3 + 1] -= streakData.speed[i] * delta * intensity;
        streakData.pos[i * 3] += 0.35 * delta * intensity;
        if (streakData.pos[i * 3 + 1] < tableY) {
          const s = splashData.cursor % SPLASH_COUNT;
          splashData.pos[s * 3] = streakData.pos[i * 3];
          splashData.pos[s * 3 + 2] = streakData.pos[i * 3 + 2];
          splashData.life[s] = 1;
          splashData.cursor++;
          streakData.pos[i * 3 + 1] = 2.6 + Math.random() * 1.6;
          streakData.pos[i * 3] = (Math.random() - 0.5) * 5;
          streakData.pos[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
        }
        dummy.position.set(
          streakData.pos[i * 3],
          streakData.pos[i * 3 + 1],
          streakData.pos[i * 3 + 2],
        );
        dummy.rotation.set(0, 0, -0.15);
        dummy.scale.set(1, 0.7 + intensity * 0.4, 1);
        dummy.updateMatrix();
        streaks.current.setMatrixAt(i, dummy.matrix);
      }
      streaks.current.instanceMatrix.needsUpdate = true;
      (streaks.current.material as THREE.MeshBasicMaterial).opacity = 0.28 * intensity;
    }

    if (splashes.current) {
      for (let i = 0; i < SPLASH_COUNT; i++) {
        splashData.life[i] = Math.max(0, splashData.life[i] - delta * 2.6);
        const life = splashData.life[i];
        dummy.position.set(splashData.pos[i * 3], tableY + 0.002, splashData.pos[i * 3 + 2]);
        const scale = (1 - life) * 0.14 * intensity + 0.001;
        dummy.scale.set(scale, 0.01, scale);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        splashes.current.setMatrixAt(i, dummy.matrix);
      }
      splashes.current.instanceMatrix.needsUpdate = true;
      (splashes.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * intensity;
    }
  });

  return (
    <group>
      <instancedMesh ref={streaks} args={[undefined, undefined, STREAK_COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.0018, 0.0008, 0.12, 4]} />
        <meshBasicMaterial color="#d7e6ef" transparent opacity={0} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={splashes} args={[undefined, undefined, SPLASH_COUNT]} frustumCulled={false}>
        <torusGeometry args={[0.05, 0.004, 5, 14]} />
        <meshBasicMaterial color="#e6f0f5" transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
