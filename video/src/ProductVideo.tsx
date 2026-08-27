import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AppStage, Caption, SceneExit } from "./components/Chrome";
import { LogoGlyph } from "./components/Logo";
import { CAPTIONS, VO_FROM } from "./data";
import { InboxScreen } from "./screens/InboxScreen";
import { LeadsScreen } from "./screens/LeadsScreen";
import { ProductScreen } from "./screens/ProductScreen";

const OPEN = 20;
const PRODUCT = 108;
const LEADS = 110;
const INBOX = 118;
const CLOSE = 130;
const OVERLAP = 10;

const PRODUCT_FROM = OPEN - 6;
const LEADS_FROM = PRODUCT_FROM + PRODUCT - OVERLAP;
const INBOX_FROM = LEADS_FROM + LEADS - OVERLAP;
const CLOSE_FROM = INBOX_FROM + INBOX - OVERLAP;

export const VIDEO = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: CLOSE_FROM + CLOSE,
} as const;

function OpenCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 320, mass: 0.32 },
    durationInFrames: 10,
  });
  const type = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, stiffness: 260, mass: 0.35 },
    durationInFrames: 10,
  });
  return (
    <AbsoluteFill className="video-open">
      <div
        className="video-wordmark"
        style={{
          opacity: logo,
          transform: `scale(${0.72 + logo * 0.28})`,
        }}
      >
        <LogoGlyph size={36} />
        Omentir
      </div>
      <h1
        className="video-title"
        style={{
          opacity: type,
          transform: `translateY(${(1 - type) * 18}px)`,
        }}
      >
        Omentir will find you customers
      </h1>
    </AbsoluteFill>
  );
}

function CloseCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 240, mass: 0.36 },
    durationInFrames: 12,
  });
  const rest = spring({
    frame: frame - 6,
    fps,
    config: { damping: 16, stiffness: 240, mass: 0.36 },
    durationInFrames: 10,
  });
  return (
    <AbsoluteFill className="video-close">
      <div className="video-wordmark" style={{ opacity: enter }}>
        <LogoGlyph size={28} />
        Omentir
      </div>
      <h1
        className="video-title"
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 16}px)`,
        }}
      >
        or you pay nothing.
      </h1>
      <p className="video-price" style={{ opacity: rest }}>
        $49 a month. Three bookings a week.
      </p>
      <div
        className="video-ctas"
        style={{
          opacity: rest,
          transform: `translateY(${(1 - rest) * 10}px)`,
        }}
      >
        <span className="video-btn is-filled">Get started</span>
        <span className="video-btn is-ghost">See how it works</span>
      </div>
      <p className="video-url" style={{ opacity: rest }}>
        omentir.com
      </p>
    </AbsoluteFill>
  );
}

function ProductBeat() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneExit duration={PRODUCT}>
      <div className="video-stage">
        <AppStage>
          <ProductScreen />
        </AppStage>
      </div>
      <Caption text={CAPTIONS[0]} index={0} frame={frame} fps={fps} />
    </SceneExit>
  );
}

function LeadsBeat() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneExit duration={LEADS}>
      <div className="video-stage">
        <AppStage>
          <LeadsScreen />
        </AppStage>
      </div>
      <Caption text={CAPTIONS[1]} index={1} frame={frame} fps={fps} />
    </SceneExit>
  );
}

function InboxBeat() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneExit duration={INBOX}>
      <div className="video-stage">
        <AppStage>
          <InboxScreen />
        </AppStage>
      </div>
      <Caption text={CAPTIONS[2]} index={2} frame={frame} fps={fps} />
    </SceneExit>
  );
}

export const ProductVideo = () => {
  return (
    <AbsoluteFill className="video-root">
      <div className="hero-grid-bg" />
      <Sequence from={VO_FROM} name="Voiceover">
        <Audio src={staticFile("video/launch-vo.wav")} />
      </Sequence>
      <Sequence from={0} durationInFrames={OPEN} name="Open">
        <OpenCard />
      </Sequence>
      <Sequence from={PRODUCT_FROM} durationInFrames={PRODUCT} name="Product">
        <ProductBeat />
      </Sequence>
      <Sequence from={LEADS_FROM} durationInFrames={LEADS} name="Leads">
        <LeadsBeat />
      </Sequence>
      <Sequence from={INBOX_FROM} durationInFrames={INBOX} name="Inbox">
        <InboxBeat />
      </Sequence>
      <Sequence from={CLOSE_FROM} durationInFrames={CLOSE} name="Close">
        <CloseCard />
      </Sequence>
    </AbsoluteFill>
  );
};
