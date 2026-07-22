import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "SSO Callback - Omentir",
  description: "Complete secure sign-in to Omentir.",
  path: "/sso-callback",
  noIndex: true,
});

export default function SsoCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
