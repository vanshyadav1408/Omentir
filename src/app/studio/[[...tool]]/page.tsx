import StudioClient from "./studio-client";

export { metadata, viewport } from "next-sanity/studio";

export const dynamic = "force-static";

export default function StudioPage() {
  return <StudioClient />;
}
