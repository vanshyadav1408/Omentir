import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/**
 * Shared marketing table chrome. The /integrations connect matrix is the
 * reference: rounded frame, low-surface header, hairline row rules, no
 * cream or zinc leftovers from the old light blog tables.
 */
export function MarketingTable({
  children,
  className = "",
  minWidthClass = "min-w-[40rem]",
}: {
  children: ReactNode;
  className?: string;
  minWidthClass?: string;
}) {
  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)] ${className}`}
    >
      <table
        className={`w-full border-collapse text-left text-sm ${minWidthClass}`}
      >
        {children}
      </table>
    </div>
  );
}

export function MarketingThead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[var(--md-sys-color-surface-container-low)]">
      {children}
    </thead>
  );
}

export function MarketingTh({
  children,
  className = "",
  scope = "col",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  const padding = scope === "row" ? "px-5 py-4 align-top" : "px-5 py-3.5";
  return (
    <th
      scope={scope}
      className={`${padding} font-semibold text-[var(--md-sys-color-on-surface)] ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function MarketingTd({
  children,
  className = "",
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`px-5 py-4 align-top leading-6 text-[var(--md-sys-color-on-surface-variant)] ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function MarketingTr({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`border-t border-[var(--md-sys-color-outline-variant)] ${className}`}
    >
      {children}
    </tr>
  );
}
