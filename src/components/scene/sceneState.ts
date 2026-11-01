export type SceneControls = {
  rain: number;
  flood: number;
  floodOpacity: number;
  storm: number;
  wetness: number;
  /** 0 = Beleriand, 1 = Middle-earth (same physical map). */
  mapMorph: number;
  showMarkers: boolean;
  /** Dim environment / room visibility during map close-ups. */
  worldReveal: number;
};

export const sceneControls: SceneControls = {
  rain: 0,
  flood: 0,
  floodOpacity: 0,
  storm: 0,
  wetness: 0,
  mapMorph: 0,
  showMarkers: false,
  worldReveal: 0,
};

export function resetSceneControls() {
  sceneControls.rain = 0;
  sceneControls.flood = 0;
  sceneControls.floodOpacity = 0;
  sceneControls.storm = 0;
  sceneControls.wetness = 0;
  sceneControls.mapMorph = 0;
  sceneControls.showMarkers = false;
  sceneControls.worldReveal = 0;
}

export type CameraApi = {
  setLookTarget: (x: number, y: number, z: number, duration?: number) => void;
  setPosition: (x: number, y: number, z: number, duration?: number) => void;
  setFov: (fov: number, duration?: number) => void;
};

export const cameraApi: CameraApi = {
  setLookTarget: () => {},
  setPosition: () => {},
  setFov: () => {},
};

/** Shared layout constants — one map centered on the table. */
export const MAP_LAYOUT = {
  /** Sits on scaled gothic_coffee_table top (~0.866m). */
  position: [0, 0.872, 0] as [number, number, number],
  width: 1.1,
  height: 0.82,
};
