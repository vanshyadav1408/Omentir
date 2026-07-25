/**
 * Official social brand marks. LinkedIn / X / Telegram paths are from
 * simple-icons (CC0); the Whop "w" is lifted from Whop's own header lockup,
 * which simple-icons does not carry.
 *
 * Every mark fills with `currentColor` and sizes in `em`, so the caller sets
 * size (font-size) and colour. Use `.brand-mono` from globals.css to render
 * them black on light / white on dark — do NOT colour them with
 * `text-[#0a66c2]`-style utilities, which the dark theme remaps to pastels with
 * !important for text legibility.
 */
type MarkProps = { className?: string };

export function LinkedInMark({ className }: MarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function XMark({ className }: MarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" />
    </svg>
  );
}

/**
 * Whop's three-stroke "w". Wider than it is tall (1.94:1), unlike the square
 * marks above — hence the explicit width, so `font-size` still drives its size
 * without distorting it.
 */
export function WhopMark({ className }: MarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height="1em"
      viewBox="0 0 39.5021 20.3648"
      width="1.94em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.29654 0.0205078C3.70387 0.0205078 1.92397 1.15863 0.565903 2.45194C0.565903 2.45194 0.0206171 2.96927 0.0309055 2.98996L5.71011 8.70125L11.3893 2.98996C10.309 1.50006 8.28221 0.0205078 6.29654 0.0205078Z" />
      <path d="M20.3194 0.0205078C17.7267 0.0205078 15.9468 1.16897 14.5888 2.45194C14.5888 2.45194 14.0949 2.95892 14.0641 2.98996L7.04736 10.0463L12.7163 15.7472L25.4019 2.98996C24.3216 1.50006 22.2948 0.0205078 20.3194 0.0205078Z" />
      <path d="M34.3738 0.0205078C31.7811 0.0205078 30.0012 1.16897 28.6431 2.45194C28.6431 2.45194 28.1287 2.95893 28.1081 2.98997L14.0645 17.1026L15.546 18.5925C17.8403 20.8998 21.6059 20.8998 23.9105 18.5925L39.4357 2.98997C38.3657 1.50006 36.3594 0.0205078 34.3738 0.0205078Z" />
    </svg>
  );
}

export function TelegramMark({ className }: MarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.005-.03.01-.14-.052-.198-.062-.06-.152-.039-.217-.023-.093.021-1.582 1.006-4.465 2.951-.422.29-.802.432-1.14.425-.379-.008-1.107-.213-1.648-.39-.663-.215-1.19-.33-1.171-.694.02-.378.545-.762 1.575-1.15 2.062-.777 4.802-1.79 5.05-1.878.35-.124 1.246-.408 1.755-.399z" />
    </svg>
  );
}
