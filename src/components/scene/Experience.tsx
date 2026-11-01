"use client";

import { ContactShadows, Environment } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { ScenePhase } from "@/lib/animation";
import { Candles } from "./Candles";
import { Fireplace } from "./Fireplace";
import { FloodWater } from "./FloodWater";
import { MorphingMap } from "./MapPlane";
import { PlaceMarkers } from "./PlaceMarkers";
import { StudyProps } from "./Props";
import { Rain } from "./Rain";
import { TavernRoom } from "./TavernRoom";
import { MAP_LAYOUT, cameraApi, resetSceneControls, sceneControls } from "./sceneState";
import { WoodTable } from "./WoodTable";

type ExperienceProps = {
  playing: boolean;
  onPhaseChange: (phase: ScenePhase) => void;
  onPlayingChange: (playing: boolean) => void;
  replayToken: number;
};

const MAP_Y = MAP_LAYOUT.position[1];

const TILT = 0.088;

/** Southwest of the Beleriand sheet: Belegaer, the south coast, and the Bay of Balar. */
const CAM_BELERIAND = {
  pos: [-0.33, MAP_Y + 0.9, 0.15 + 0.9 * TILT] as [number, number, number],
  look: [-0.33, MAP_Y, 0.15] as [number, number, number],
  fov: 32,
};

/** Centered on the Middle-earth sheet after the drowning. */
const CAM_MIDDLE_EARTH = {
  pos: [0.0, MAP_Y + 0.68, 0.06] as [number, number, number],
  look: [0, MAP_Y, 0] as [number, number, number],
  fov: 30,
};

const MIN_HEIGHT = 0.28;
const MAX_HEIGHT = 1.5;

/** Diorama view — real table, candles, masonry hearth in frame. */
const CAM_DIORAMA = {
  pos: [1.25, 1.55, 1.95] as [number, number, number],
  look: [-0.15, 1.05, -0.35] as [number, number, number],
  fov: 38,
};

/**
 * Held on the whole atlas from the south, close enough that a shoreline
 * crossing the page is the shot. West is screen-left; the sea travels right.
 */
const CAM_FLOOD = {
  pos: [0.0, 1.16, 0.98] as [number, number, number],
  look: [0.0, MAP_Y + 0.012, -0.02] as [number, number, number],
  fov: 40,
};

function axisLimit(limit: number, half: number) {
  // Zoomed out past the sheet: keep the parchment in frame.
  if (half >= limit * 0.92) {
    const drift = Math.min(0.05, Math.max(0, half - limit) * 0.2);
    return [-drift, drift] as const;
  }
  // Zoomed in: pan until the view reaches the edge, with room for the
  // southwest idle framing on a wide window.
  const margin = 0.28;
  return [-limit - margin + half, limit + margin - half] as const;
}

function clampLook(look: THREE.Vector3, height: number, aspect: number, fov: number) {
  const halfH = height * Math.tan((fov * Math.PI) / 360);
  const halfW = halfH * aspect;
  const [minX, maxX] = axisLimit(MAP_LAYOUT.width / 2, halfW);
  const [minZ, maxZ] = axisLimit(MAP_LAYOUT.height / 2, halfH);
  look.x = THREE.MathUtils.clamp(look.x, Math.min(minX, maxX), Math.max(minX, maxX));
  look.z = THREE.MathUtils.clamp(look.z, Math.min(minZ, maxZ), Math.max(minZ, maxZ));
}

function CameraRig({ explore }: { explore: boolean }) {
  const { camera, gl, size } = useThree();
  const look = useRef(new THREE.Vector3(...CAM_BELERIAND.look));
  const targetLook = useRef(new THREE.Vector3(...CAM_BELERIAND.look));
  const exploreLook = useRef(new THREE.Vector3(...CAM_BELERIAND.look));
  const exploreHeight = useRef(CAM_BELERIAND.pos[1] - MAP_Y);
  const height = useRef(exploreHeight.current);
  const exploreRef = useRef(explore);
  const sizeRef = useRef(size);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);
  const persp = camera as THREE.PerspectiveCamera;
  /** makeDefault swaps the camera after the first render. Always drive the live one. */
  const activeCamera = useRef(persp);

  exploreRef.current = explore;
  sizeRef.current = size;

  useEffect(() => {
    camera.position.set(...CAM_BELERIAND.pos);
    persp.fov = CAM_BELERIAND.fov;
    persp.updateProjectionMatrix();
    look.current.set(...CAM_BELERIAND.look);
    targetLook.current.set(...CAM_BELERIAND.look);
    exploreLook.current.set(...CAM_BELERIAND.look);
    exploreHeight.current = CAM_BELERIAND.pos[1] - MAP_Y;
    height.current = exploreHeight.current;

    const live = () => activeCamera.current;

    cameraApi.setLookTarget = (x, y, z, duration = 0) => {
      if (duration <= 0.02) {
        gsap.killTweensOf(targetLook.current);
        targetLook.current.set(x, y, z);
        look.current.set(x, y, z);
        if (exploreRef.current) exploreLook.current.set(x, y, z);
        return;
      }
      gsap.to(targetLook.current, {
        x,
        y,
        z,
        duration,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    };

    cameraApi.setPosition = (x, y, z, duration = 2) => {
      const active = live();
      if (duration <= 0.02) {
        gsap.killTweensOf(active.position);
        active.position.set(x, y, z);
        if (exploreRef.current) {
          const nextHeight = Math.max(MIN_HEIGHT, y - MAP_Y);
          exploreHeight.current = nextHeight;
          height.current = nextHeight;
          exploreLook.current.set(x, MAP_Y, z - nextHeight * TILT);
          look.current.copy(exploreLook.current);
        }
        return;
      }
      gsap.to(active.position, {
        x,
        y,
        z,
        duration,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    };

    cameraApi.setFov = (fov, duration = 2) => {
      const active = live();
      if (duration <= 0.02) {
        gsap.killTweensOf(active);
        active.fov = fov;
        active.updateProjectionMatrix();
        return;
      }
      gsap.to(active, {
        fov,
        duration,
        ease: "power2.inOut",
        overwrite: "auto",
        onUpdate: () => active.updateProjectionMatrix(),
      });
    };
  }, [camera, persp]);

  useEffect(() => {
    if (!explore) {
      dragging.current = false;
      pointers.current.clear();
      targetLook.current.copy(exploreLook.current);
      look.current.copy(exploreLook.current);
      gl.domElement.style.cursor = "";
      return;
    }
    const active = activeCamera.current;
    gsap.killTweensOf(active.position);
    gsap.killTweensOf(active);
    gsap.killTweensOf(targetLook.current);
    const nextHeight = Math.max(MIN_HEIGHT, active.position.y - MAP_Y);
    exploreHeight.current = nextHeight;
    height.current = nextHeight;
    exploreLook.current.set(active.position.x, MAP_Y, active.position.z - nextHeight * TILT);
    look.current.copy(exploreLook.current);
    gl.domElement.style.cursor = "grab";
  }, [explore, camera, persp, gl]);

  useEffect(() => {
    const el = gl.domElement;

    const visibleSpan = (nextHeight: number) => {
      const { width, height: viewH } = sizeRef.current;
      const aspect = width / Math.max(1, viewH);
      const fov = activeCamera.current.fov;
      const halfH = nextHeight * Math.tan((fov * Math.PI) / 360);
      return { aspect, halfH, halfW: halfH * aspect, width, height: viewH, fov };
    };

    const zoomAbout = (nextHeight: number, ndcX: number, ndcY: number) => {
      const current = exploreHeight.current;
      const clamped = THREE.MathUtils.clamp(nextHeight, MIN_HEIGHT, MAX_HEIGHT);
      const before = visibleSpan(current);
      const after = visibleSpan(clamped);
      const hitX = exploreLook.current.x + ndcX * before.halfW;
      const hitZ = exploreLook.current.z - ndcY * before.halfH;
      exploreLook.current.x = hitX - ndcX * after.halfW;
      exploreLook.current.z = hitZ + ndcY * after.halfH;
      exploreHeight.current = clamped;
      clampLook(exploreLook.current, clamped, after.aspect, after.fov);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!exploreRef.current || event.button !== 0) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic events used in checks cannot capture the pointer.
      }
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
        dragging.current = false;
        return;
      }
      dragging.current = true;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      el.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!exploreRef.current || !pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist.current > 8) {
          const rect = el.getBoundingClientRect();
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const ndcX = ((midX - rect.left) / rect.width) * 2 - 1;
          const ndcY = -(((midY - rect.top) / rect.height) * 2 - 1);
          zoomAbout(exploreHeight.current * (pinchDist.current / dist), ndcX, ndcY);
        }
        pinchDist.current = dist;
        return;
      }
      if (!dragging.current) return;
      const dx = event.clientX - lastPointer.current.x;
      const dy = event.clientY - lastPointer.current.y;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      const span = visibleSpan(exploreHeight.current);
      exploreLook.current.x -= (dx / span.width) * span.halfW * 2;
      exploreLook.current.z -= (dy / span.height) * span.halfH * 2;
      clampLook(exploreLook.current, exploreHeight.current, span.aspect, span.fov);
    };

    const endPointer = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) pinchDist.current = 0;
      if (pointers.current.size === 0) {
        dragging.current = false;
        el.style.cursor = exploreRef.current ? "grab" : "";
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!exploreRef.current) return;
      event.preventDefault();
      const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const rect = el.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      zoomAbout(exploreHeight.current * Math.exp(dy * 0.00115), ndcX, ndcY);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endPointer);
    el.addEventListener("pointercancel", endPointer);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endPointer);
      el.removeEventListener("pointercancel", endPointer);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, persp]);

  useFrame((state, delta) => {
    const active = state.camera as THREE.PerspectiveCamera;
    activeCamera.current = active;
    if (exploreRef.current) {
      const k = 1 - Math.exp(-9 * Math.min(delta, 0.05));
      height.current += (exploreHeight.current - height.current) * k;
      look.current.lerp(exploreLook.current, k);
      active.position.set(
        look.current.x,
        MAP_Y + height.current,
        look.current.z + height.current * TILT,
      );
      active.lookAt(look.current.x, MAP_Y, look.current.z);
      return;
    }
    // Same per-frame catch-up the flood shots were tuned with.
    look.current.lerp(targetLook.current, 0.08);
    active.lookAt(look.current);
  });

  return null;
}

function EnvironmentRig() {
  const { scene } = useThree();

  useFrame(() => {
    const reveal = sceneControls.worldReveal;
    // No brown saloon wash on the close-up map — only open the HDRI as we pull out.
    scene.environmentIntensity = THREE.MathUtils.lerp(0, 0.28, reveal);
    const bg = scene.background as THREE.Texture & { intensity?: number };
    if (bg && "isTexture" in bg) {
      bg.intensity = THREE.MathUtils.lerp(0, 0.2, reveal);
    }
  });

  return (
    <Environment
      files="/assets/hdri/cowboy_town_saloon_2k.hdr"
      background
      backgroundBlurriness={0.7}
      backgroundIntensity={0}
      environmentIntensity={0}
    />
  );
}

/** Hides the tavern until the camera pulls back — close-up is map only. */
function TavernWorld({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const reveal = sceneControls.worldReveal;
    if (!group.current) return;
    group.current.visible = reveal > 0.02;
    // Don't mutably fade every material — that killed the fireplace fire.
    // Visibility gate is enough; lights/fire stay intact.
  });
  return <group ref={group}>{children}</group>;
}

export function Experience({
  playing,
  onPhaseChange,
  onPlayingChange,
  replayToken,
}: ExperienceProps) {
  const lightning = useRef(0);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const keyFill = useRef<THREE.DirectionalLight>(null);
  /** Prevents `playing: false` from resetting the morph back to Beleriand. */
  const settledOnMiddleEarth = useRef(false);

  useEffect(() => {
    // Completing the timeline sets playing=false, which re-runs this effect.
    // Keep Middle-earth if we've already finished the drowning.
    if (!playing) {
      if (settledOnMiddleEarth.current) {
        sceneControls.mapMorph = 1;
        sceneControls.showMarkers = true;
        sceneControls.worldReveal = 0;
        sceneControls.rain = 0;
        sceneControls.flood = 0.12;
        sceneControls.floodOpacity = 0.06;
        sceneControls.wetness = 0.18;
        cameraApi.setPosition(...CAM_MIDDLE_EARTH.pos, 0.01);
        cameraApi.setLookTarget(...CAM_MIDDLE_EARTH.look, 0.01);
        cameraApi.setFov(CAM_MIDDLE_EARTH.fov, 0.01);
        onPhaseChange("idle-middle-earth");
        return;
      }

      resetSceneControls();
      onPhaseChange("idle-beleriand");
      cameraApi.setPosition(...CAM_BELERIAND.pos, 0.01);
      cameraApi.setLookTarget(...CAM_BELERIAND.look, 0.01);
      cameraApi.setFov(CAM_BELERIAND.fov, 0.01);
      return;
    }

    settledOnMiddleEarth.current = false;
    resetSceneControls();
    onPhaseChange("idle-beleriand");
    cameraApi.setPosition(...CAM_BELERIAND.pos, 0.01);
    cameraApi.setLookTarget(...CAM_BELERIAND.look, 0.01);
    cameraApi.setFov(CAM_BELERIAND.fov, 0.01);

    const tl = gsap.timeline({
      onComplete: () => {
        sceneControls.mapMorph = 1;
        sceneControls.showMarkers = true;
        sceneControls.worldReveal = 0;
        sceneControls.rain = 0;
        sceneControls.flood = 0.12;
        sceneControls.floodOpacity = 0.06;
        sceneControls.wetness = 0.18;
        settledOnMiddleEarth.current = true;
        onPhaseChange("idle-middle-earth");
        onPlayingChange(false);
      },
    });

    // 1) Pull out of the atlas into a tabletop diorama
    tl.call(() => onPhaseChange("revealing"), [], 0);
    tl.to(sceneControls, { worldReveal: 1, duration: 3.4, ease: "power2.inOut" }, 0);
    tl.call(
      () => {
        cameraApi.setPosition(...CAM_DIORAMA.pos, 3.6);
        cameraApi.setLookTarget(...CAM_DIORAMA.look, 3.6);
        cameraApi.setFov(CAM_DIORAMA.fov, 3.6);
      },
      [],
      0.05,
    );

    // Get onto the atlas and hold there before the sea moves, so the
    // shoreline crossing the page is a still shot, not a camera move.
    tl.call(
      () => {
        cameraApi.setPosition(...CAM_FLOOD.pos, 2.2);
        cameraApi.setLookTarget(...CAM_FLOOD.look, 2.2);
        cameraApi.setFov(CAM_FLOOD.fov, 2.2);
      },
      [],
      2.6,
    );

    // 2) Storm. The western sea is already on the page.
    tl.call(() => onPhaseChange("raining"), [], 3.4);
    tl.to(
      sceneControls,
      {
        rain: 1,
        storm: 0.85,
        wetness: 0.9,
        flood: 0.0,
        floodOpacity: 0.94,
        duration: 1.4,
        ease: "power1.out",
      },
      3.4,
    );

    // 3) The front travels east across Beleriand. Linear, so it doesn't creep.
    tl.call(() => onPhaseChange("flooding"), [], 5.0);
    tl.to(
      sceneControls,
      {
        flood: 1,
        floodOpacity: 0.96,
        storm: 1,
        wetness: 1,
        duration: 6.2,
        ease: "none",
      },
      5.0,
    );
    // Swap the drawing only after the sea has covered the west.
    tl.to(sceneControls, { mapMorph: 1, duration: 2.4, ease: "power2.inOut" }, 10.6);

    // 4) Still on this camera: the sea draws back, then we dive in.
    tl.call(() => onPhaseChange("settling"), [], 11.6);
    tl.to(
      sceneControls,
      {
        rain: 0.1,
        storm: 0.2,
        floodOpacity: 0.55,
        flood: 0.08,
        wetness: 0.3,
        duration: 3.2,
        ease: "power1.in",
      },
      11.6,
    );
    tl.call(
      () => {
        cameraApi.setPosition(...CAM_MIDDLE_EARTH.pos, 3.4);
        cameraApi.setLookTarget(...CAM_MIDDLE_EARTH.look, 3.4);
        cameraApi.setFov(CAM_MIDDLE_EARTH.fov, 3.4);
      },
      [],
      14.4,
    );
    tl.to(
      sceneControls,
      {
        worldReveal: 0,
        rain: 0,
        floodOpacity: 0.05,
        flood: 0.08,
        wetness: 0.15,
        duration: 3.2,
        ease: "power2.inOut",
      },
      14.6,
    );

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, replayToken]);

  useFrame(() => {
    if (sceneControls.storm > 0.55 && Math.random() > 0.992) lightning.current = 1;
    lightning.current *= 0.88;
    const reveal = sceneControls.worldReveal;
    // Bright neutral light for map close-up; dim it once candle/fire take over
    if (ambient.current) {
      ambient.current.intensity =
        THREE.MathUtils.lerp(0.42, 0.03, reveal) + lightning.current * 0.35;
    }
    if (hemi.current) {
      hemi.current.intensity =
        THREE.MathUtils.lerp(0.4, 0.06, reveal) + lightning.current * 0.15;
    }
    if (keyFill.current) {
      keyFill.current.intensity = THREE.MathUtils.lerp(0.6, 0.05, reveal);
    }
  });

  return (
    <>
      <CameraRig explore={!playing} />
      <color attach="background" args={["#1a1814"]} />
      <fog attach="fog" args={["#1a1814", 8, 18]} />

      {/* Neutral fill so the close-up atlas stays cream, not candle-brown */}
      <ambientLight ref={ambient} intensity={0.42} color="#f2eadc" />
      <hemisphereLight ref={hemi} args={["#efe6d6", "#2a2418", 0.4]} />
      <directionalLight
        ref={keyFill}
        position={[0.15, 2.2, 0.5]}
        intensity={0.6}
        color="#fff8ec"
        castShadow={false}
      />

      <TavernWorld>
        <TavernRoom />
        <Fireplace />
        <WoodTable />
        <Candles />
        <StudyProps />
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.7}
          scale={9}
          blur={2.8}
          far={4}
          color="#000000"
        />
      </TavernWorld>

      <MorphingMap />

      <FloodWater />
      <Rain />
      <PlaceMarkers />

      <EnvironmentRig />

      <EffectComposer enableNormalPass={false} multisampling={2}>
        <N8AO quality="performance" aoRadius={0.25} intensity={0.9} distanceFalloff={0.6} />
        <Bloom
          luminanceThreshold={0.65}
          intensity={0.7}
          mipmapBlur
          levels={4}
          radius={0.45}
        />
        <Vignette offset={0.35} darkness={0.45} />
      </EffectComposer>
    </>
  );
}
