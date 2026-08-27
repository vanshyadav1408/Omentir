type LogoMarkProps = {
  className?: string;
  size?: number;
};

export function LogoGlyph({ className, size = 32 }: LogoMarkProps) {
  const spoke = (rotation: number) => (
    <g key={rotation} transform={`rotate(${rotation})`}>
      <rect x="-7" y="-90" width="14" height="180" rx="2" />
    </g>
  );
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={{ display: "block", flexShrink: 0 }}
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
