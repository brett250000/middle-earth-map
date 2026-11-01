"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import type { ScenePhase } from "@/lib/animation";
import { Experience } from "./scene/Experience";
import { MAP_LAYOUT } from "./scene/sceneState";

type SceneCanvasProps = {
  playing: boolean;
  onPhaseChange: (phase: ScenePhase) => void;
  onPlayingChange: (playing: boolean) => void;
  replayToken: number;
};

export function SceneCanvas({
  playing,
  onPhaseChange,
  onPlayingChange,
  replayToken,
}: SceneCanvasProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{
        position: [-0.33, MAP_LAYOUT.position[1] + 0.9, 0.229],
        fov: 32,
        near: 0.02,
        far: 50,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      className="scene-canvas"
    >
      <Suspense fallback={null}>
        <Experience
          playing={playing}
          onPhaseChange={onPhaseChange}
          onPlayingChange={onPlayingChange}
          replayToken={replayToken}
        />
      </Suspense>
    </Canvas>
  );
}
