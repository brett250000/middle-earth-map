"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MAP_LAYOUT, sceneControls } from "./sceneState";

/**
 * The drowning comes from the sea, not from a puddle in the middle of the page.
 * West (uv.x = 0) is Belegaer. South (uv.y = 0) is the Bay of Balar.
 * `inland` is 0 in that sea and climbs toward the eastern mountains; the
 * shoreline is the contour where inland == waterline(flood).
 *
 * Plane local +X is world east, local +Y is world north (mesh is rotated
 * -90° on X, so local +Y lands on world -Z).
 */

const glslLib = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float inlandOf(vec2 uv) {
    // One connected sea: the western ocean, with the Bay of Balar as a second mouth.
    float west = uv.x;
    float bay = length((uv - vec2(0.30, 0.02)) * vec2(1.15, 1.25));
    float inland = min(west, bay * 0.52);

    // A tongue races up the Sirion ahead of the main front.
    float river = smoothstep(0.05, 0.0, abs(uv.x - (0.31 + uv.y * 0.03)));
    inland -= river * smoothstep(0.12, 0.4, uv.y) * smoothstep(0.82, 0.5, uv.y) * 0.1;

    // East of the Blue Mountains the page stays dry.
    inland += smoothstep(0.46, 0.72, uv.x) * 0.7;

    float n = noise(uv * vec2(3.0, 4.5) + vec2(uTime * 0.12, -uTime * 0.04));
    float n2 = noise(uv * vec2(7.5, 5.5) - uTime * vec2(0.22, 0.08));
    inland += (n - 0.5) * 0.035 + (n2 - 0.5) * 0.012;
    return inland;
  }

  vec2 flowDir(vec2 uv) {
    vec2 fromWest = vec2(1.0, 0.04);
    vec2 fromBay = uv - vec2(0.32, 0.08);
    float bayL = length(fromBay) + 0.0001;
    fromBay /= bayL;
    float bayInf = smoothstep(0.62, 0.1, length((uv - vec2(0.32, 0.08)) * vec2(1.0, 1.05)));
    bayInf *= smoothstep(0.62, 0.22, uv.x);
    vec2 dir = normalize(mix(fromWest, fromBay, bayInf));
    float river = smoothstep(0.09, 0.0, abs(uv.x - (0.30 + uv.y * 0.045)));
    dir = normalize(mix(dir, vec2(0.2, 1.0), river * smoothstep(0.88, 0.15, uv.y)));
    return dir;
  }

  float waterlineOf(float flood, float storm) {
    // Linear in flood so the front travels at a steady, readable pace.
    // 0 sits on the western coast; 1 is against the eastern mountains.
    return mix(0.07, 0.8, clamp(flood, 0.0, 1.0)) + storm * 0.015;
  }
`;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uStorm;
  uniform float uFlood;
  uniform float uFloodVel;
  ${glslLib}
  varying vec2 vUv;

  void main() {
    vUv = uv;
    float depth = waterlineOf(uFlood, uStorm) - inlandOf(uv);
    vec2 flow = flowDir(uv);
    float surge = clamp(uFloodVel * 9.0, -1.15, 1.6);
    float dirSign = surge < -0.05 ? -1.0 : 1.0;
    float energy = 0.55 + uStorm * 0.4 + max(surge, 0.0) * 0.55;

    vec3 pos = position;

    // A low breaker on the waterline, plus a smaller one behind it.
    // Kept short so the sea stays a sheet, not a pile of white lumps.
    float crest = exp(-pow((depth - 0.01) * 28.0, 2.0)) * 0.02;
    crest += exp(-pow((depth - 0.08) * 20.0, 2.0)) * 0.008;
    float edgeFade = smoothstep(0.0, 0.16, uv.x) * smoothstep(0.0, 0.16, uv.y)
                   * smoothstep(1.0, 0.8, uv.x) * smoothstep(1.0, 0.8, uv.y);
    crest *= edgeFade * energy;
    pos.z += crest;

    float speed = (2.2 + uStorm * 1.6 + abs(surge) * 2.4) * dirSign;
    float open = smoothstep(-0.01, 0.12, depth);
    vec2 p = pos.xy;
    vec2 tangent = vec2(-flow.y, flow.x);
    float h = 0.0;
    h += sin(dot(p, flow) * 11.0 - uTime * speed) * 0.011;
    h += sin(dot(p, flow) * 5.5 + dot(p, tangent) * 2.2 - uTime * speed * 0.65) * 0.014;
    h += sin(dot(p, tangent) * 16.0 + uTime * 1.8) * 0.0035 * uStorm;
    h *= open * (0.55 + energy * 0.25) * edgeFade;
    pos.z += h;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uStorm;
  uniform float uFlood;
  uniform float uFloodVel;
  uniform float uOpacity;
  ${glslLib}
  varying vec2 vUv;

  void main() {
    float depth = waterlineOf(uFlood, uStorm) - inlandOf(vUv);
    float wet = smoothstep(-0.01, 0.03, depth);
    vec2 flow = flowDir(vUv);
    float surge = clamp(uFloodVel * 9.0, -1.15, 1.6);
    float dirSign = surge < -0.05 ? -1.0 : 1.0;
    float along = dot(vUv, flow);
    float across = dot(vUv, vec2(-flow.y, flow.x));

    float march = sin(along * 14.0 - uTime * (2.2 + abs(surge)) * 3.2 * dirSign);
    float current = smoothstep(0.15, 0.8, march * 0.5 + 0.5);

    vec3 deepCol = vec3(0.015, 0.09, 0.14);
    vec3 shallowCol = vec3(0.04, 0.2, 0.26);
    vec3 streak = vec3(0.08, 0.32, 0.36);
    vec3 col = mix(shallowCol, deepCol, smoothstep(0.0, 0.2, depth));
    col = mix(col, streak, current * wet * 0.65);

    float n = noise(vec2(across * 18.0 - uTime * 1.4 * dirSign, along * 3.0));
    float foam = (1.0 - smoothstep(0.0, 0.018, abs(depth))) * (0.65 + 0.35 * n);
    col = mix(col, vec3(0.62, 0.68, 0.64), clamp(foam, 0.0, 1.0));

    // Fully cover the page behind the front. A tint disappears in the candle glare.
    float alpha = wet * mix(0.82, 1.0, smoothstep(0.0, 0.05, depth)) * uOpacity;
    alpha = max(alpha, foam * wet * uOpacity);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export function FloodWater() {
  const sheet = useRef<THREE.Group>(null);
  const prevFlood = useRef(0);
  const floodVel = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uStorm: { value: 0 },
      uFlood: { value: 0 },
      uFloodVel: { value: 0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const { flood, floodOpacity, storm } = sceneControls;
    const dt = Math.min(delta, 0.05);
    const instant = (flood - prevFlood.current) / Math.max(dt, 1 / 120);
    prevFlood.current = flood;
    const targetVel = Math.abs(instant) > 2.5 ? 0 : instant;
    floodVel.current = THREE.MathUtils.damp(floodVel.current, targetVel, 3.2, dt);

    const visible = floodOpacity > 0.02;
    if (sheet.current) {
      sheet.current.visible = visible;
      sheet.current.position.y = MAP_LAYOUT.position[1] + 0.014 + flood * 0.012;
      sheet.current.traverse((obj) => {
        const mat = (obj as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
        if (!mat?.uniforms) return;
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uOpacity.value = floodOpacity;
        mat.uniforms.uStorm.value = storm;
        mat.uniforms.uFlood.value = flood;
        mat.uniforms.uFloodVel.value = floodVel.current;
      });
    }
  });

  return (
    <group ref={sheet} position={MAP_LAYOUT.position} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={5} frustumCulled={false}>
        <planeGeometry args={[MAP_LAYOUT.width, MAP_LAYOUT.height, 160, 120]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          toneMapped={false}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
    </group>
  );
}
