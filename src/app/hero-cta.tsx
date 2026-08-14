"use client";

import { useUser } from "@clerk/nextjs";
import HeroCtaControls from "./hero-cta-controls";

export default function HeroCta() {
  const { isSignedIn } = useUser();
  return <HeroCtaControls isSignedIn={Boolean(isSignedIn)} />;
}
