import type { ReactNode } from "react";

export default function HeroCopy({ children }: { children: ReactNode }) {
  return (
    <>
      <h1 className="hero-home-title hero-enter w-full text-[var(--md-sys-color-on-surface)]">
        Omentir will find your customers
        <br />
        or you pay nothing.
      </h1>
      {children}
    </>
  );
}
