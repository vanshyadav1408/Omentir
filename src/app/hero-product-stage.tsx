import Image from "next/image";
import HeroAppPreview from "./hero-app-preview";

export default function HeroProductStage({ todayKey }: { todayKey: string }) {
  return (
    <figure className="hero-product-frame" aria-label="A demo of the Omentir app with sample data">
      <div className="hero-app-stage">
        <Image
          src="/hero-lake.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 80rem) 76rem, calc(100vw - 32px)"
          quality={90}
          className="hero-product-frame-media"
        />
        {/* Not aria-hidden: the demo sidebar has real buttons. */}
        <div className="hero-app">
          <HeroAppPreview todayKey={todayKey} />
        </div>
      </div>
    </figure>
  );
}
