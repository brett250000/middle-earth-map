"use client";

import { useGLTF } from "@react-three/drei";
import { useShadowClone } from "./useModel";

const CHAIR = "/assets/models/WoodenChair_01/WoodenChair_01_1k.gltf";
const BENCH = "/assets/models/painted_wooden_bench/painted_wooden_bench_1k.gltf";
const LANTERN = "/assets/models/wooden_lantern_01/wooden_lantern_01_1k.gltf";
const BOTTLES = "/assets/models/wine_bottles_01/wine_bottles_01_1k.gltf";

function Model({
  path,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const root = useShadowClone(path, { matte: true, roughnessBoost: 0.12 });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={root.clone(true)} />
    </group>
  );
}

export function StudyProps() {
  return (
    <group>
      <Model path={CHAIR} position={[-0.15, 0, 1.05]} rotation={[0, 0.15, 0]} scale={0.42} />
      <Model path={CHAIR} position={[0.95, 0, 1.1]} rotation={[0, -0.55, 0]} scale={0.42} />
      <Model path={BENCH} position={[1.55, 0, -0.9]} rotation={[0, -0.4, 0]} scale={1} />
      <Model path={LANTERN} position={[0.85, 0.872, -0.4]} rotation={[0, 0.5, 0]} scale={0.85} />
      <Model path={BOTTLES} position={[-0.85, 0.872, -0.35]} rotation={[0, 0.8, 0]} scale={1.05} />
    </group>
  );
}

useGLTF.preload(CHAIR);
useGLTF.preload(BENCH);
useGLTF.preload(LANTERN);
useGLTF.preload(BOTTLES);
