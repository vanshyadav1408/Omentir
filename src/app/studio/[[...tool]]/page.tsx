import StudioClient from "./studio-client";

export { metadata, viewport } from "next-sanity/studio";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function StudioPage() {
  return <StudioClient />;
}
