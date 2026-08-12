import { authOrSignedOut } from "@/lib/server/clerk-session";
import HeroCtaControls from "./hero-cta-controls";

export default async function HeroCta() {
  const { userId } = await authOrSignedOut();
  return <HeroCtaControls isSignedIn={Boolean(userId)} />;
}
