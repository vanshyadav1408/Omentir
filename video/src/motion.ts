import { spring, type SpringConfig } from "remotion";

export const SNAP: SpringConfig = {
  damping: 16,
  stiffness: 280,
  mass: 0.38,
};

export function pop(
  frame: number,
  fps: number,
  delay = 0,
  fromY = 18,
): { opacity: number; transform: string } {
  const local = frame - delay;
  const s = spring({
    frame: Math.max(0, local),
    fps,
    config: SNAP,
    durationInFrames: 12,
  });
  const hidden = local < 0;
  return {
    opacity: hidden ? 0 : s,
    transform: `translateY(${(1 - s) * fromY}px)`,
  };
}

