import Link from "next/link";

export default function CompleteSetupPrompt({
  icon,
  message,
}: {
  icon: string;
  message: string;
}) {
  return (
    <div className="grid h-full min-h-0 place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
          <span
            className="material-symbols-outlined ms-size-16 mr-1.5 align-middle"
            aria-hidden="true"
          >
            {icon}
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
