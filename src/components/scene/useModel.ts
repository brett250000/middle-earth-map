"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/** Clone a GLTF scene and enable shadows + slightly matte wood-friendly materials. */
export function useShadowClone(
  path: string,
  opts?: { matte?: boolean; roughnessBoost?: number },
) {
  const { scene } = useGLTF(path);
  const matte = opts?.matte ?? true;
  const roughnessBoost = opts?.roughnessBoost ?? 0.15;

  return useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat?.isMeshStandardMaterial) continue;
        if (matte) {
          mat.roughness = Math.min(1, (mat.roughness ?? 0.7) + roughnessBoost);
          mat.envMapIntensity = Math.min(mat.envMapIntensity ?? 1, 0.35);
          mat.metalness = Math.min(mat.metalness ?? 0, 0.15);
        }
      }
    });
    return clone;
  }, [scene, matte, roughnessBoost]);
}
