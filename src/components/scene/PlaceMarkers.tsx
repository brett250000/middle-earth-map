"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useState } from "react";
import { locations, MAP_HEIGHT, MAP_WIDTH } from "@/data/locations";
import { MAP_LAYOUT, sceneControls } from "./sceneState";

function toLocal(x: number, y: number): [number, number, number] {
  const lx = (x / MAP_WIDTH - 0.5) * MAP_LAYOUT.width;
  const lz = (y / MAP_HEIGHT - 0.5) * MAP_LAYOUT.height;
  return [lx, 0.012, lz];
}

const FEATURED = new Set([
  "hobbiton",
  "rivendell",
  "minas-tirith",
  "mount-doom",
  "edoras",
  "grey-havens",
]);

export function PlaceMarkers() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useFrame(() => {
    if (sceneControls.showMarkers !== visible) {
      setVisible(sceneControls.showMarkers);
      if (!sceneControls.showMarkers) setActive(null);
    }
  });

  if (!visible) return null;

  const places = locations.filter((l) => FEATURED.has(l.id));

  return (
    <group position={MAP_LAYOUT.position}>
      {places.map((place) => {
        const [x, y, z] = toLocal(place.x, place.y);
        const isActive = active === place.id;
        return (
          <group key={place.id} position={[x, y, z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                setActive(isActive ? null : place.id);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[0.011, 16, 16]} />
              <meshStandardMaterial
                color={isActive ? "#e8c56b" : "#c9a227"}
                emissive="#c9a227"
                emissiveIntensity={isActive ? 1.2 : 0.55}
                toneMapped={false}
              />
            </mesh>
            {isActive && (
              <Html distanceFactor={2.2} position={[0, 0.05, 0]} center>
                <div className="marker-card">
                  <p className="marker-card__region">{place.region}</p>
                  <h3>{place.name}</h3>
                  <p>{place.summary}</p>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
