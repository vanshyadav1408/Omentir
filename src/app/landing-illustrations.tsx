/* Google Aura / Expressive no-outline geometric illustrations.
   Rules: no stroke/borders on figures; shapes meet by color contrast only;
   flat vectors + soft semi-transparent radial gradients for depth;
   abstract, friendly proportions; simple or no facial detail. */

const PINK = "#ba3871";
const PINK_SOFT = "#e892b2";
const SURFACE = "#ffffff";
const SURFACE_DIM = "#f0eeea";
const SURFACE_DEEP = "#e4e2dc";
const INK_SOFT = "rgba(23, 23, 23, 0.12)";

/* Theme-aware palette: these resolve through globals.css so the same shapes
   read correctly on light surfaces and the dark charcoal ladder. */
const T_PRIMARY = "var(--md-sys-color-primary)";
const T_ON_PRIMARY = "var(--md-sys-color-on-primary)";
const T_PRIMARY_CONTAINER = "var(--md-sys-color-primary-container)";
const T_ON_PRIMARY_CONTAINER = "var(--md-sys-color-on-primary-container)";
const T_RAISED = "var(--md-sys-color-surface-container-highest)";
const T_RAISED_SOFT = "var(--md-sys-color-surface-container-high)";
const T_INK = "var(--md-sys-color-on-surface)";
const T_PINK_PASTEL = "var(--md-ref-primary-70)";

/** Soft light-source gradient defs reused by illustrations. */
function SoftLightDefs({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      <radialGradient id={`${idPrefix}-glow`} cx="30%" cy="25%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${idPrefix}-pink-glow`} cx="40%" cy="30%" r="65%">
        <stop offset="0%" stopColor={PINK_SOFT} stopOpacity="0.45" />
        <stop offset="100%" stopColor={PINK} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${idPrefix}-pink-orb`} cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor={PINK_SOFT} />
        <stop offset="100%" stopColor={PINK} />
      </radialGradient>
      <radialGradient id={`${idPrefix}-card`} cx="25%" cy="20%" r="85%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor={SURFACE_DIM} />
      </radialGradient>
    </defs>
  );
}

function Sparkle({
  cx,
  cy,
  size = 10,
  fill = PINK,
}: {
  cx: number;
  cy: number;
  size?: number;
  fill?: string;
}) {
  const s = size / 2;
  return (
    <path
      d={`M${cx} ${cy - s} l${s * 0.28} ${s * 0.72} ${s * 0.72} ${s * 0.28} -${s * 0.72} ${s * 0.28} -${s * 0.28} ${s * 0.72} -${s * 0.28} -${s * 0.72} -${s * 0.72} -${s * 0.28} ${s * 0.72} -${s * 0.28} z`}
      fill={fill}
      opacity={0.95}
    />
  );
}

export function FindBuyersIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <ellipse cx="100" cy="110" rx="68" ry="7" fill={T_INK} fillOpacity="0.08" />
      {/* back lead card */}
      <g transform="rotate(-4 78 40)">
        <rect x="30" y="18" width="92" height="44" rx="12" fill={T_RAISED_SOFT} />
        <circle cx="52" cy="40" r="9" fill={T_PINK_PASTEL} />
        <rect x="68" y="31" width="40" height="6" rx="3" fill={T_INK} fillOpacity="0.14" />
        <rect x="68" y="43" width="26" height="5" rx="2.5" fill={T_INK} fillOpacity="0.08" />
      </g>
      {/* front lead card */}
      <rect x="46" y="48" width="104" height="52" rx="14" fill={T_RAISED} />
      <circle cx="72" cy="74" r="11" fill={T_PRIMARY} />
      <rect x="90" y="64" width="48" height="7" rx="3.5" fill={T_INK} fillOpacity="0.16" />
      <rect x="90" y="78" width="32" height="6" rx="3" fill={T_INK} fillOpacity="0.09" />
      {/* magnifier locked on the lead */}
      <circle cx="160" cy="38" r="21" fill={T_PRIMARY} />
      <circle cx="160" cy="38" r="14" fill={T_PRIMARY_CONTAINER} />
      <circle cx="160" cy="33.5" r="4.5" fill={T_ON_PRIMARY_CONTAINER} />
      <path d="M149 47 a11 8 0 0 1 22 0 z" fill={T_ON_PRIMARY_CONTAINER} />
      <rect x="172" y="52" width="20" height="9" rx="4.5" transform="rotate(42 172 52)" fill={T_PRIMARY} />
      <Sparkle cx={28} cy={86} size={13} fill={T_PRIMARY} />
      <Sparkle cx={184} cy={84} size={9} fill={T_PINK_PASTEL} />
    </svg>
  );
}

export function PersonalizeIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <ellipse cx="100" cy="110" rx="64" ry="7" fill={T_INK} fillOpacity="0.08" />
      {/* message bubble with tail */}
      <path
        d="M40 22 h96 a14 14 0 0 1 14 14 v32 a14 14 0 0 1 -14 14 h-62 l-20 16 6 -16 h-20 a14 14 0 0 1 -14 -14 v-32 a14 14 0 0 1 14 -14 z"
        fill={T_RAISED}
      />
      {/* personalized name token + copy lines */}
      <rect x="42" y="36" width="46" height="14" rx="7" fill={T_PRIMARY_CONTAINER} />
      <rect x="50" y="40.5" width="30" height="5" rx="2.5" fill={T_ON_PRIMARY_CONTAINER} fillOpacity="0.85" />
      <rect x="94" y="40" width="40" height="6" rx="3" fill={T_INK} fillOpacity="0.14" />
      <rect x="42" y="58" width="78" height="6" rx="3" fill={T_INK} fillOpacity="0.14" />
      <rect x="42" y="70" width="52" height="5" rx="2.5" fill={T_INK} fillOpacity="0.08" />
      {/* pencil finishing the line */}
      <g transform="rotate(135 150 76)">
        <rect x="143.5" y="52" width="13" height="42" rx="3" fill={T_PRIMARY} />
        <rect x="143.5" y="46" width="13" height="9" rx="3" fill={T_PRIMARY_CONTAINER} />
        <path d="M143.5 94 h13 l-6.5 13 z" fill={T_PINK_PASTEL} />
      </g>
      <Sparkle cx={168} cy={24} size={13} fill={T_PRIMARY} />
      <Sparkle cx={186} cy={52} size={9} fill={T_PINK_PASTEL} />
    </svg>
  );
}

export function BookDemosIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <ellipse cx="100" cy="110" rx="62" ry="7" fill={T_INK} fillOpacity="0.08" />
      {/* calendar card */}
      <rect x="50" y="24" width="100" height="76" rx="14" fill={T_RAISED} />
      <path d="M50 48 v-10 a14 14 0 0 1 14 -14 h72 a14 14 0 0 1 14 14 v10 z" fill={T_PRIMARY} />
      <rect x="70" y="16" width="7" height="16" rx="3.5" fill={T_PRIMARY_CONTAINER} />
      <rect x="123" y="16" width="7" height="16" rx="3.5" fill={T_PRIMARY_CONTAINER} />
      {/* date grid */}
      <rect x="64" y="58" width="18" height="12" rx="4" fill={T_INK} fillOpacity="0.09" />
      <rect x="91" y="58" width="18" height="12" rx="4" fill={T_INK} fillOpacity="0.09" />
      <rect x="118" y="58" width="18" height="12" rx="4" fill={T_INK} fillOpacity="0.09" />
      <rect x="64" y="78" width="18" height="12" rx="4" fill={T_INK} fillOpacity="0.09" />
      <rect x="91" y="78" width="18" height="12" rx="4" fill={T_PRIMARY_CONTAINER} />
      <rect x="118" y="78" width="18" height="12" rx="4" fill={T_INK} fillOpacity="0.09" />
      {/* booked check orb */}
      <circle cx="150" cy="92" r="17" fill={T_PRIMARY} />
      <path d="M141.5 91 L147.5 97 L160.5 83 L156 79 L147.5 88.5 L145.5 86.5 Z" fill={T_ON_PRIMARY} />
      <Sparkle cx={34} cy={42} size={12} fill={T_PRIMARY} />
      <Sparkle cx={172} cy={40} size={9} fill={T_PINK_PASTEL} />
    </svg>
  );
}

export function AgentControlIllustration() {
  return (
    <svg viewBox="0 0 220 130" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="ac" />
      <ellipse cx="110" cy="120" rx="80" ry="8" fill={INK_SOFT} />
      {/* abstract agent: head + soft body, no face detail */}
      <rect x="22" y="18" width="8" height="14" rx="4" fill={PINK_SOFT} transform="translate(21 0)" />
      <circle cx="47" cy="18" r="6" fill={`url(#ac-pink-orb)`} />
      <rect x="20" y="30" width="54" height="48" rx="16" fill={`url(#ac-card)`} />
      <rect x="20" y="30" width="54" height="48" rx="16" fill="url(#ac-glow)" />
      <circle cx="38" cy="50" r="6" fill={`url(#ac-pink-orb)`} />
      <circle cx="56" cy="50" r="6" fill={`url(#ac-pink-orb)`} />
      <rect x="34" y="62" width="26" height="6" rx="3" fill="rgba(23,23,23,0.1)" />
      {/* soft connector blobs */}
      <circle cx="88" cy="54" r="4" fill={PINK_SOFT} opacity={0.5} />
      <circle cx="102" cy="60" r="3.5" fill={PINK} opacity={0.35} />
      {/* dashboard card */}
      <rect x="118" y="34" width="86" height="64" rx="14" fill={`url(#ac-card)`} />
      <rect x="118" y="34" width="86" height="64" rx="14" fill="url(#ac-glow)" />
      <path
        d="M118 50 v-2 a14 14 0 0 1 14 -14 h58 a14 14 0 0 1 14 14 v2 z"
        fill={`url(#ac-pink-orb)`}
      />
      <rect x="130" y="60" width="50" height="6" rx="3" fill="rgba(23,23,23,0.12)" />
      <rect x="130" y="72" width="36" height="5" rx="2.5" fill="rgba(23,23,23,0.08)" />
      <rect x="130" y="82" width="44" height="5" rx="2.5" fill="rgba(23,23,23,0.08)" />
      <circle cx="196" cy="102" r="16" fill={`url(#ac-pink-orb)`} />
      <circle cx="196" cy="102" r="16" fill="url(#ac-glow)" />
      <path d="M188 101 L193 106 L206 92 L201 88 L193 97 L192 95 Z" fill="#ffffff" />
      <Sparkle cx={96} cy={24} size={14} />
      <Sparkle cx={28} cy={98} size={10} fill={PINK_SOFT} />
    </svg>
  );
}

export function TokenKeyIllustration() {
  return (
    <svg viewBox="0 0 160 90" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="tk" />
      <ellipse cx="80" cy="82" rx="52" ry="6" fill={INK_SOFT} />
      <circle cx="52" cy="45" r="22" fill={`url(#tk-card)`} />
      <circle cx="52" cy="45" r="22" fill="url(#tk-glow)" />
      <circle cx="52" cy="45" r="9" fill={`url(#tk-pink-orb)`} />
      <rect x="70" y="41" width="56" height="8" rx="4" fill={SURFACE_DEEP} />
      <rect x="106" y="49" width="6" height="14" rx="3" fill={SURFACE_DEEP} />
      <rect x="120" y="49" width="6" height="18" rx="3" fill={SURFACE_DEEP} />
      <Sparkle cx={128} cy={18} size={12} />
    </svg>
  );
}

export function ConnectPlugIllustration() {
  return (
    <svg viewBox="0 0 160 90" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="cp" />
      <ellipse cx="80" cy="82" rx="50" ry="6" fill={INK_SOFT} />
      <rect x="12" y="42" width="28" height="8" rx="4" fill={SURFACE_DEEP} opacity={0.7} />
      <rect x="36" y="30" width="28" height="24" rx="8" fill={`url(#cp-pink-orb)`} />
      <rect x="36" y="30" width="28" height="24" rx="8" fill="url(#cp-glow)" />
      <rect x="60" y="34" width="14" height="6" rx="3" fill={PINK_SOFT} />
      <rect x="60" y="44" width="14" height="6" rx="3" fill={PINK_SOFT} />
      <rect x="78" y="22" width="44" height="38" rx="12" fill={`url(#cp-card)`} />
      <rect x="78" y="22" width="44" height="38" rx="12" fill="url(#cp-glow)" />
      <circle cx="100" cy="41" r="7" fill={`url(#cp-pink-orb)`} />
      <Sparkle cx={136} cy={60} size={10} />
    </svg>
  );
}

export function FounderGrowthIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <ellipse cx="100" cy="110" rx="68" ry="7" fill={T_INK} fillOpacity="0.08" />
      {/* founder profile card */}
      <rect x="26" y="28" width="72" height="70" rx="16" fill={T_RAISED} />
      <circle cx="62" cy="54" r="13" fill={T_PRIMARY} />
      <path d="M38 98 a24 22 0 0 1 48 0 z" fill={T_PRIMARY_CONTAINER} />
      {/* revenue climbing */}
      <rect x="114" y="74" width="14" height="24" rx="4" fill={T_INK} fillOpacity="0.12" />
      <rect x="134" y="58" width="14" height="40" rx="4" fill={T_PINK_PASTEL} />
      <rect x="154" y="40" width="14" height="58" rx="4" fill={T_PRIMARY} />
      {/* upward arrow above the tallest bar */}
      <path d="M161 20 l9 11 h-5.5 v8 h-7 v-8 H152 Z" fill={T_PRIMARY} />
      <circle cx="141" cy="48" r="4.5" fill={T_PRIMARY} fillOpacity="0.35" />
      <Sparkle cx={120} cy={30} size={12} fill={T_PRIMARY} />
    </svg>
  );
}

export function AgenticPromptIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <ellipse cx="100" cy="110" rx="64" ry="7" fill={T_INK} fillOpacity="0.08" />
      {/* prompt bubble from the agent side */}
      <path
        d="M104 22 h60 a12 12 0 0 1 12 12 v22 a12 12 0 0 1 -12 12 h-36 l-16 14 4 -14 h-12 a12 12 0 0 1 -12 -12 v-22 a12 12 0 0 1 12 -12 z"
        fill={T_PRIMARY_CONTAINER}
      />
      <Sparkle cx={112} cy={45} size={12} fill={T_ON_PRIMARY_CONTAINER} />
      <rect x="126" y="34" width="38" height="6" rx="3" fill={T_ON_PRIMARY_CONTAINER} fillOpacity="0.85" />
      <rect x="126" y="46" width="26" height="5" rx="2.5" fill={T_ON_PRIMARY_CONTAINER} fillOpacity="0.55" />
      {/* robot head */}
      <circle cx="53" cy="30" r="6" fill={T_PRIMARY} />
      <rect x="50.5" y="32" width="5" height="12" rx="2.5" fill={T_PINK_PASTEL} />
      <rect x="26" y="42" width="56" height="46" rx="17" fill={T_RAISED} />
      <circle cx="44" cy="61" r="6" fill={T_PRIMARY} />
      <circle cx="64" cy="61" r="6" fill={T_PRIMARY} />
      <rect x="43" y="74" width="22" height="5" rx="2.5" fill={T_INK} fillOpacity="0.16" />
      {/* thinking dots between robot and bubble */}
      <circle cx="90" cy="88" r="4" fill={T_PRIMARY} fillOpacity="0.45" />
      <circle cx="100" cy="96" r="3" fill={T_PRIMARY} fillOpacity="0.3" />
      <Sparkle cx={182} cy={80} size={10} fill={T_PINK_PASTEL} />
    </svg>
  );
}

export function DeveloperApiIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <ellipse cx="100" cy="110" rx="62" ry="7" fill={T_INK} fillOpacity="0.08" />
      {/* code window */}
      <rect x="40" y="22" width="120" height="78" rx="14" fill={T_RAISED} />
      <path d="M40 42 v-6 a14 14 0 0 1 14 -14 h92 a14 14 0 0 1 14 14 v6 z" fill={T_PRIMARY_CONTAINER} />
      <circle cx="56" cy="32" r="4" fill={T_PRIMARY} />
      <circle cx="68" cy="32" r="4" fill={T_ON_PRIMARY_CONTAINER} fillOpacity="0.45" />
      <circle cx="80" cy="32" r="4" fill={T_ON_PRIMARY_CONTAINER} fillOpacity="0.45" />
      {/* code lines with keyword highlights */}
      <rect x="54" y="52" width="30" height="6" rx="3" fill={T_PRIMARY} />
      <rect x="90" y="52" width="34" height="6" rx="3" fill={T_INK} fillOpacity="0.14" />
      <rect x="64" y="64" width="42" height="6" rx="3" fill={T_INK} fillOpacity="0.14" />
      <rect x="112" y="64" width="20" height="6" rx="3" fill={T_PINK_PASTEL} />
      <rect x="64" y="76" width="24" height="6" rx="3" fill={T_INK} fillOpacity="0.09" />
      <rect x="94" y="76" width="34" height="6" rx="3" fill={T_INK} fillOpacity="0.14" />
      <rect x="54" y="88" width="18" height="6" rx="3" fill={T_INK} fillOpacity="0.09" />
      {/* terminal prompt orb */}
      <circle cx="164" cy="92" r="17" fill={T_PRIMARY} />
      <path d="M156 84 l10 8 -10 8 v-5.5 l4.5 -2.5 -4.5 -2.5 z" fill={T_ON_PRIMARY} />
      <rect x="168" y="97" width="9" height="4" rx="2" fill={T_ON_PRIMARY} />
      <Sparkle cx={28} cy={44} size={12} fill={T_PRIMARY} />
      <Sparkle cx={178} cy={54} size={9} fill={T_PINK_PASTEL} />
    </svg>
  );
}

export function PaperPlaneIllustration() {
  return (
    <svg viewBox="0 0 150 90" fill="none" aria-hidden className="h-full w-auto">
      <ellipse cx="80" cy="82" rx="46" ry="5" fill="rgba(23, 23, 23, 0.14)" />
      {/* climbing trail */}
      <circle cx="20" cy="74" r="3" fill="var(--md-ref-primary-80)" opacity={0.55} />
      <circle cx="36" cy="67" r="3" fill="var(--md-ref-primary-80)" opacity={0.75} />
      <circle cx="52" cy="59" r="3" fill="var(--md-ref-primary-80)" opacity={0.9} />
      {/* folded plane: near-white top wing, pastel keel, soft inner fold */}
      <path d="M138 16 L100 52 L106 74 Z" fill="var(--md-ref-primary-70)" />
      <path d="M138 16 L100 52 L112 55 Z" fill="var(--md-ref-primary-80)" />
      <path d="M138 16 L68 46 L100 52 Z" fill="var(--md-ref-primary-95)" />
    </svg>
  );
}

export function HotLeadsIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="hl" />
      <ellipse cx="100" cy="110" rx="64" ry="7" fill={INK_SOFT} />
      <rect x="26" y="36" width="106" height="52" rx="14" fill={`url(#hl-card)`} />
      <rect x="26" y="36" width="106" height="52" rx="14" fill="url(#hl-glow)" />
      <circle cx="50" cy="58" r="11" fill={`url(#hl-pink-orb)`} />
      <rect x="68" y="50" width="48" height="6" rx="3" fill="rgba(23,23,23,0.14)" />
      <rect x="68" y="62" width="32" height="5" rx="2.5" fill="rgba(23,23,23,0.08)" />
      {/* flame as stacked soft blobs */}
      <ellipse cx="158" cy="68" rx="14" ry="18" fill={`url(#hl-pink-orb)`} />
      <ellipse cx="158" cy="56" rx="9" ry="14" fill={PINK_SOFT} opacity={0.85} />
      <ellipse cx="158" cy="48" rx="5" ry="8" fill="#ffd0e0" opacity={0.9} />
      <Sparkle cx={36} cy={18} size={12} />
    </svg>
  );
}

export function RepliesIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="rp" />
      <ellipse cx="100" cy="110" rx="64" ry="7" fill={INK_SOFT} />
      <path d="M58 50 84 58M142 50l-26 8M100 78v12" stroke={T_PRIMARY} strokeWidth="4" strokeLinecap="round" opacity="0.25" />
      <circle cx="52" cy="48" r="18" fill={T_RAISED} />
      <circle cx="52" cy="48" r="12" fill={T_INK} />
      <path d="M52 39v18M43 48h18" stroke={T_RAISED} strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      <circle cx="148" cy="48" r="18" fill="#F3E0D8" />
      <path d="M148 37c4 6 6 12 0 22-6-10-4-16 0-22Z" fill="#D97757" />
      <circle cx="100" cy="92" r="18" fill="#E5DDF7" />
      <path d="M100 80c2 6 6 10 12 12-6 2-10 6-12 12-2-6-6-10-12-12 6-2 10-6 12-12Z" fill="#8E6DCF" />
      <circle cx="100" cy="58" r="31" fill={`url(#rp-pink-orb)`} />
      <circle cx="100" cy="58" r="31" fill="url(#rp-glow)" />
      <path
        d="M100 37c3 10 8 16 18 21-10 5-15 11-18 21-3-10-8-16-18-21 10-5 15-11 18-21Z"
        fill={T_ON_PRIMARY}
      />
      <Sparkle cx={168} cy={24} size={12} />
    </svg>
  );
}

export function EmptyChartIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="ec" />
      <ellipse cx="100" cy="110" rx="60" ry="7" fill={INK_SOFT} />
      {/* axes as soft filled bars, not stroked lines */}
      <rect x="38" y="22" width="6" height="72" rx="3" fill={SURFACE_DEEP} />
      <rect x="38" y="88" width="126" height="6" rx="3" fill={SURFACE_DEEP} />
      <rect x="48" y="56" width="116" height="4" rx="2" fill={SURFACE_DIM} />
      {/* area under curve */}
      <path
        d="M48 84 L76 70 L104 76 L132 52 L158 38 L158 90 L48 90 Z"
        fill={PINK}
        opacity={0.12}
      />
      {/* rising dots + connecting soft ribbons as thick rounded rects along segments */}
      <circle cx="76" cy="70" r="6" fill={SURFACE} />
      <circle cx="76" cy="70" r="5" fill={PINK_SOFT} />
      <circle cx="132" cy="52" r="6" fill={SURFACE} />
      <circle cx="132" cy="52" r="5" fill={PINK_SOFT} />
      <circle cx="158" cy="38" r="7" fill={`url(#ec-pink-orb)`} />
      <circle cx="158" cy="38" r="7" fill="url(#ec-glow)" />
      <Sparkle cx={176} cy={70} size={12} />
    </svg>
  );
}

export function ActivityPulseIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="ap2" />
      <ellipse cx="100" cy="110" rx="64" ry="7" fill={INK_SOFT} />
      <rect x="30" y="30" width="132" height="60" rx="16" fill={`url(#ap2-card)`} />
      <rect x="30" y="30" width="132" height="60" rx="16" fill="url(#ap2-glow)" />
      {/* pulse as filled rounded polygon bars */}
      <rect x="42" y="57" width="18" height="6" rx="3" fill={PINK_SOFT} opacity={0.5} />
      <rect x="62" y="42" width="8" height="36" rx="4" fill={`url(#ap2-pink-orb)`} />
      <rect x="74" y="50" width="8" height="28" rx="4" fill={PINK_SOFT} />
      <rect x="86" y="36" width="8" height="48" rx="4" fill={`url(#ap2-pink-orb)`} />
      <rect x="98" y="48" width="8" height="24" rx="4" fill={PINK_SOFT} opacity={0.8} />
      <rect x="110" y="54" width="28" height="6" rx="3" fill={PINK_SOFT} opacity={0.5} />
      <circle cx="150" cy="60" r="6" fill={`url(#ap2-pink-orb)`} />
      <Sparkle cx={176} cy={20} size={12} />
    </svg>
  );
}

export function InboxIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" aria-hidden className="h-full w-auto">
      <SoftLightDefs idPrefix="ib" />
      <ellipse cx="100" cy="110" rx="64" ry="7" fill={INK_SOFT} />
      <g transform="rotate(-6 100 38)">
        <rect x="64" y="14" width="72" height="42" rx="10" fill={`url(#ib-card)`} />
        <rect x="64" y="14" width="72" height="42" rx="10" fill="url(#ib-glow)" />
        <path d="M66 18 L100 40 L134 18" fill={SURFACE_DIM} />
        <path d="M66 18 L100 40 L134 18 L134 14 L66 14 Z" fill={PINK} opacity={0.12} />
      </g>
      <path
        d="M40 62v20a12 12 0 0 0 12 12h96a12 12 0 0 0 12-12V62h-30l-8 12h-44l-8-12z"
        fill={`url(#ib-card)`}
      />
      <path
        d="M40 62v20a12 12 0 0 0 12 12h96a12 12 0 0 0 12-12V62h-30l-8 12h-44l-8-12z"
        fill="url(#ib-glow)"
      />
      <circle cx="160" cy="58" r="10" fill={`url(#ib-pink-orb)`} />
      <circle cx="160" cy="58" r="10" fill="url(#ib-glow)" />
      <Sparkle cx={26} cy={38} size={12} />
    </svg>
  );
}
