import type { ReactNode } from "react";
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FACE_FILE, NAV } from "../data";
import { LogoGlyph } from "./Logo";

export function Face({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const src = FACE_FILE[name];
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`home-mock-face is-${size}`}>
      {src ? <img src={staticFile(src)} alt="" /> : initials}
    </span>
  );
}

export function LinkedInMark() {
  return <img src={staticFile("linkedin-in-mark.svg")} alt="" className="home-mock-in" />;
}

export function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 6.5 5 9l4.5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScoreCell({ score, frame, fps, delay }: { score: number; frame: number; fps: number; delay: number }) {
  const tone = score < 60 ? " is-low" : score >= 85 ? " is-high" : "";
  const fill = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 160, mass: 0.4 },
    durationInFrames: 16,
  });
  return (
    <i className={`home-mock-scorecell${tone}`}>
      {score}
      <span className="home-mock-scorebar">
        <b style={{ width: `${score * fill}%` }} />
      </span>
    </i>
  );
}

export function FitRing({
  score,
  low = false,
  frame,
  fps,
  delay = 0,
}: {
  score: number;
  low?: boolean;
  frame: number;
  fps: number;
  delay?: number;
}) {
  const fill = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.4 },
    durationInFrames: 18,
  });
  return (
    <span className={`home-mock-ring${low ? " is-low" : ""}`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.9" />
        <circle cx="18" cy="18" r="15.9" strokeDasharray={`${score * fill} 100`} />
      </svg>
      <b>{score}</b>
    </span>
  );
}

export function Shell({
  page,
  title,
  action,
  search,
  children,
}: {
  page: "overview" | "agents" | "messages" | "leads" | "product";
  title: string;
  action?: string;
  search?: string;
  children: ReactNode;
}) {
  const active = page === "product" ? "" : page;
  return (
    <div className="home-mock-app">
      <aside className="home-mock-rail">
        <p className="home-mock-brand">
          <LogoGlyph size={16} />
          Omentir
        </p>
        <ul>
          {NAV.map((item) => (
            <li key={item.id} className={item.id === active ? "is-on" : undefined}>
              {item.label}
            </li>
          ))}
        </ul>
        <p className={page === "product" ? "is-on" : undefined}>My Product</p>
      </aside>
      <div className="home-mock-stage">
        <header className="home-mock-top">
          <h3>{title}</h3>
          {search ? <p className="home-mock-search">{search}</p> : null}
          {action ? <span className="home-mock-btn">{action}</span> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export function AppStage({ children }: { children: ReactNode }) {
  return (
    <div className="hero-app-stage">
      <img src={staticFile("hero-lake.jpg")} alt="" className="hero-product-frame-media" />
      <div className="hero-app">
        <div className="hero-app-canvas">{children}</div>
      </div>
    </div>
  );
}

export function Caption({
  text,
  index,
  frame,
  fps,
}: {
  text: string;
  index: number;
  frame: number;
  fps: number;
}) {
  const s = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 240, mass: 0.35 },
    durationInFrames: 10,
  });
  return (
    <div className="video-caption" style={{ opacity: s, transform: `translateY(${(1 - s) * 10}px)` }}>
      <p>{text}</p>
      <div className="video-dots">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className={dot === index ? "is-on" : undefined} />
        ))}
      </div>
    </div>
  );
}

export function SceneExit({
  children,
  duration,
}: {
  children: ReactNode;
  duration: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leave = interpolate(frame, [duration - 10, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 220, mass: 0.42 },
    durationInFrames: 12,
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: enter * (1 - leave),
        transform: `translateX(${(1 - enter) * 70 + leave * -80}px)`,
      }}
    >
      {children}
    </div>
  );
}
