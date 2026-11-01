"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { MAP_LAYOUT, sceneControls } from "./sceneState";

function curlGeometry(width: number, height: number) {
  const geo = new THREE.PlaneGeometry(width, height, 48, 36);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (width * 0.5);
    const ny = y / (height * 0.5);
    const edge = Math.pow(Math.max(Math.abs(nx), Math.abs(ny)), 3.2);
    // Very slight curl only — hard curls were exposing brown backing
    pos.setZ(i, edge * 0.006);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

type MorphingMapProps = {
  beleriandUrl?: string;
  middleEarthUrl?: string;
};

/**
 * One physical parchment sheet. Kept matte so the saloon HDRI cannot
 * wash a brown reflection over the atlas art.
 */
export const MorphingMap = forwardRef<Group, MorphingMapProps>(function MorphingMap(
  {
    beleriandUrl = "/beleriand-atlas-v3.jpg",
    middleEarthUrl = "/middle-earth-atlas-v3.jpg",
  },
  ref,
) {
  const { width, height, position } = MAP_LAYOUT;
  const [beleriand, middleEarth] = useTexture([beleriandUrl, middleEarthUrl]);

  for (const tex of [beleriand, middleEarth]) {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
  }

  const faceGeo = useMemo(() => curlGeometry(width, height), [width, height]);
  const belMat = useRef<THREE.MeshStandardMaterial>(null);
  const midMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const morph = sceneControls.mapMorph;
    const wet = sceneControls.wetness;
    const apply = (mat: THREE.MeshStandardMaterial | null, opacity: number) => {
      if (!mat) return;
      mat.opacity = opacity;
      mat.transparent = opacity < 0.999;
      mat.depthWrite = opacity > 0.85;
      mat.visible = opacity > 0.01;
      // Stay matte even when damp — avoid brown env reflections
      mat.roughness = THREE.MathUtils.lerp(0.97, 0.55, wet);
      mat.envMapIntensity = THREE.MathUtils.lerp(0.02, 0.2, wet);
    };
    apply(belMat.current, 1 - morph);
    apply(midMat.current, morph);
  });

  return (
    <group ref={ref} position={position}>
      {/* Thin cream backing — never brown */}
      <mesh position={[0, -0.003, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.012, 0.006, height + 0.012]} />
        <meshStandardMaterial color="#e2d4b4" roughness={1} envMapIntensity={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={faceGeo} castShadow receiveShadow>
        <meshStandardMaterial
          ref={belMat}
          map={beleriand}
          roughness={0.97}
          metalness={0}
          transparent
          opacity={1}
          side={THREE.FrontSide}
          envMapIntensity={0.02}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.00035, 0]}
        geometry={faceGeo}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          ref={midMat}
          map={middleEarth}
          roughness={0.97}
          metalness={0}
          transparent
          opacity={0}
          side={THREE.FrontSide}
          envMapIntensity={0.02}
        />
      </mesh>
    </group>
  );
});

export const MapPlane = MorphingMap;
