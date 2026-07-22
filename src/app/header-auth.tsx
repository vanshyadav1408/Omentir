import Link from "next/link";
import { authOrSignedOut } from "@/lib/server/clerk-session";

export default async function HeaderAuth() {
  const { userId } = await authOrSignedOut();

  if (userId) {
    return (
      <Link
        href="/dashboard"
        className="m3-btn m3-btn-filled-secondary h-9 cursor-pointer px-4 text-sm"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="m3-btn h-9 px-4 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-state-hover)] hover:text-[var(--md-sys-color-on-surface)]"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="m3-btn m3-btn-filled h-9 cursor-pointer px-4 text-sm"
      >
        Get started
      </Link>
    </>
  );
}
