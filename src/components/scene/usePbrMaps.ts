"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type PbrSet = {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  aoMap: THREE.Texture;
};

export function usePbrMaps(folder: string, repeatX = 1, repeatY = 1): PbrSet {
  const [map, normalMap, roughnessMap, aoMap] = useTexture([
    `${folder}/diff.jpg`,
    `${folder}/nor.jpg`,
    `${folder}/rough.jpg`,
    `${folder}/ao.jpg`,
  ]);

  return useMemo(() => {
    for (const t of [map, normalMap, roughnessMap, aoMap]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatX, repeatY);
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
    map.colorSpace = THREE.SRGBColorSpace;
    return { map, normalMap, roughnessMap, aoMap };
  }, [map, normalMap, roughnessMap, aoMap, repeatX, repeatY]);
}
