type LogoMarkProps = {
  className?: string;
};

/**
 * Bare logo glyph. Inherits color via `currentColor`, so it adapts to whatever
 * text color it sits on — dark in light mode, light in dark mode.
 * No circle/square/plate behind the mark — only the SVG.
 */
export function LogoGlyph({ className = "h-full w-full" }: LogoMarkProps) {
  // Four spokes drawn explicitly (no shared <use id>) so multiple LogoMarks
  // on one page never clash on duplicate SVG ids during SSR/hydration.
  const spoke = (rotation: number) => (
    <g key={rotation} transform={`rotate(${rotation})`}>
      <rect x="-7" y="-90" width="14" height="180" rx="2" />
    </g>
  );
  return (
    <svg
      viewBox="0 0 200 200"
      fill="currentColor"
      aria-hidden="true"
      className={`block shrink-0 select-none ${className}`}
    >
      <g transform="translate(100 100) rotate(22.5)">
        {spoke(0)}
        {spoke(45)}
        {spoke(90)}
        {spoke(135)}
      </g>
    </svg>
  );
}

/** Product mark used in headers, sidebars, auth — bare SVG, no placeholder. */
export default function LogoMark({ className = "h-8 w-8" }: LogoMarkProps) {
  return <LogoGlyph className={className} />;
}
