"use client";

import { useGLTF } from "@react-three/drei";
import { useShadowClone } from "./useModel";

/** Dark medieval wood — Poly Haven gothic_coffee_table (no tablecloth). */
const TABLE_PATH = "/assets/models/gothic_coffee_table/gothic_coffee_table_1k.gltf";

/**
 * Native size ~1.44 × 0.56 × 1.44m. Scaled to tavern dining height (~0.87m).
 */
export const TABLE_SCALE = 1.55;
export const TABLE_TOP_Y = 0.559 * TABLE_SCALE; // ≈ 0.866

export function WoodTable() {
  const root = useShadowClone(TABLE_PATH, { matte: true, roughnessBoost: 0.28 });
  return (
    <group position={[0, 0, 0]} rotation={[0, Math.PI * 0.25, 0]} scale={TABLE_SCALE}>
      <primitive object={root} />
    </group>
  );
}

useGLTF.preload(TABLE_PATH);
