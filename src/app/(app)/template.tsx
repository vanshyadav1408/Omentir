// Remounts on every navigation (unlike the layout), so each app page plays
// the marketing site's fade-up entrance. The animation's `backwards` fill
// releases the transform after it finishes, so fixed-position overlays
// opened later are unaffected.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="app-enter h-full">{children}</div>;
}
