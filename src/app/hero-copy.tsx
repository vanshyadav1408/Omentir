import type { ReactNode } from "react";

export default function HeroCopy({ children }: { children: ReactNode }) {
  return (
    <>
      <style>
        {`
          .hero-guarantee {
            color: #ba3871;
          }
          .hero-guarantee-title {
            font-size: clamp(1.3rem, 6.7vw, 2.15rem);
            line-height: 1.15;
          }
          @media (min-width: 768px) {
            .hero-guarantee-title {
              font-size: 2.9rem;
            }
            .hero-guarantee-title > span:first-child {
              white-space: nowrap;
            }
          }
          @media (min-width: 1024px) {
            .hero-guarantee-title {
              font-size: 3.75rem;
            }
          }
        `}
      </style>
      <h1 className="hero-display-sentence hero-guarantee-title hero-enter w-full max-w-4xl text-[var(--md-sys-color-on-surface)]">
        <span className="block whitespace-nowrap">
          You get <span className="hero-guarantee">min. 3 bookings</span>{" "}
        </span>
        <span className="block whitespace-nowrap">
          <span className="hero-guarantee">per week</span> or you pay nothing.
        </span>
      </h1>
      <p className="hero-lede hero-enter hero-enter-delay-1 mt-[1.2rem] max-w-2xl text-xs leading-5 text-[var(--md-sys-color-on-surface-variant)] md:mt-6 md:text-sm">
        Omentir automates LinkedIn outreach for solo founders, agencies, and sales
        teams to reach out to 1000+ high intent leads weekly to book you meetings
        that converts.
      </p>
      {children}
    </>
  );
}
