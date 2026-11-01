"use client";

import { PHASE_COPY, type ScenePhase } from "@/lib/animation";

type OverlayProps = {
  phase: ScenePhase;
  playing: boolean;
  onPlay: () => void;
  onReplay: () => void;
};

export function Overlay({ phase, playing, onPlay, onReplay }: OverlayProps) {
  const copy = PHASE_COPY[phase];
  const showStart = phase === "idle-beleriand" && !playing;
  const showReplay = phase === "idle-middle-earth" && !playing;

  return (
    <div className="overlay">
      <header className="overlay__brand">
        <p className="overlay__eyebrow">Atlas of the Ages</p>
        <h1>Middle-earth</h1>
      </header>

      <div className={`overlay__story ${playing ? "is-live" : ""}`} key={phase}>
        <p className="overlay__age">{copy.age}</p>
        <h2>{copy.title}</h2>
        <p className="overlay__line">{copy.line}</p>
      </div>

      <div className="overlay__actions">
        {showStart && (
          <>
            <button type="button" className="btn btn--primary" onClick={onPlay}>
              Witness the drowning
            </button>
            <p className="overlay__hint">Drag the chart to move it. Scroll to zoom.</p>
          </>
        )}
        {showReplay && (
          <>
            <button type="button" className="btn btn--primary" onClick={onReplay}>
              Replay the flood
            </button>
            <p className="overlay__hint">Click the markers to explore what endured.</p>
          </>
        )}
        {playing && (
          <p className="overlay__hint overlay__hint--pulse">The atlas remembers…</p>
        )}
      </div>
    </div>
  );
}
