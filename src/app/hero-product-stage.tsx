import Image from "next/image";
import HeroVideo from "./hero-video";

export default function HeroProductStage() {
  return (
    <figure className="hero-product-frame" aria-label="A video showing how Omentir works">
      <div className="hero-app-stage hero-video-stage">
        <Image
          src="/hero-lake.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 80rem) 76rem, calc(100vw - 32px)"
          quality={90}
          className="hero-product-frame-media"
        />
        <div className="hero-video-window">
          <HeroVideo />
        </div>
      </div>
    </figure>
  );
}
