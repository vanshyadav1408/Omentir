import Link from "next/link";
import type { ReactNode } from "react";

export const minimumBookingGuaranteeStatement =
  "Minimum 3 bookings per week or you pay nothing.";

export function MinimumBookingGuaranteeLink({
  children = "Read the full refund conditions",
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/minimum-booking-guarantee"
      style={{ fontFamily: "var(--font-roboto)" }}
      className={`font-medium text-[var(--md-sys-color-primary)] underline decoration-[var(--md-sys-color-primary)] underline-offset-4 transition-colors hover:text-[var(--md-sys-color-on-surface)] ${className}`}
    >
      {children}
    </Link>
  );
}
