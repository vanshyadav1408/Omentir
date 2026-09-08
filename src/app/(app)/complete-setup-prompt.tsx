import Link from "next/link";

export default function CompleteSetupPrompt({
  emoji,
  message,
}: {
  emoji: string;
  message: string;
}) {
  return (
    <div className="grid h-full min-h-0 place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
          <span
            className="mr-1.5 inline-block text-[13px] grayscale"
            aria-hidden
            style={{ fontVariantEmoji: "text" }}
          >
            {emoji}
          </span>
          {message}
        </p>
        <Link href="/overview" className="m3-btn m3-btn-filled mt-5 inline-flex h-8 px-3 text-xs">
          Go to Overview
        </Link>
      </div>
    </div>
  );
}
