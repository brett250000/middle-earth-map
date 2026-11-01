"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Overlay } from "@/components/Overlay";
import type { ScenePhase } from "@/lib/animation";

const SceneCanvas = dynamic(
  () => import("@/components/SceneCanvas").then((m) => m.SceneCanvas),
  { ssr: false, loading: () => <div className="scene-fallback">Lighting the hall…</div> },
);

export default function Home() {
  const [phase, setPhase] = useState<ScenePhase>("idle-beleriand");
  const [playing, setPlaying] = useState(false);
  const [replayToken, setReplayToken] = useState(0);

  const onPlay = useCallback(() => {
    setPlaying(true);
  }, []);

  const onReplay = useCallback(() => {
    setReplayToken((n) => n + 1);
    setPlaying(true);
  }, []);

  return (
    <main className="stage">
      <SceneCanvas
        playing={playing}
        onPhaseChange={setPhase}
        onPlayingChange={setPlaying}
        replayToken={replayToken}
      />
      <Overlay
        phase={phase}
        playing={playing}
        onPlay={onPlay}
        onReplay={onReplay}
      />
    </main>
  );
}
