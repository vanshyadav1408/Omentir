const VIDEO_SRC =
  "https://www.youtube.com/embed/MVV4zgLB9Ww?autoplay=0&controls=1&rel=0&playsinline=1";

export default function HeroVideo() {
  return (
    <iframe
      className="hero-video-media"
      src={VIDEO_SRC}
      title="Omentir full demo"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
