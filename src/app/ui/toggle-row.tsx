"use client";

export function ToggleRow({
  title,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div
          style={{ fontFamily: "var(--font-varta)" }}
          className="text-[14px] font-semibold text-zinc-950"
        >
          {title}
        </div>
        <div className="mt-0.5 text-[13px] font-medium text-zinc-700">{description}</div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange(!enabled);
        }}
        aria-pressed={enabled}
        aria-disabled={disabled}
        aria-label={title}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${enabled ? "bg-emerald-500" : "bg-zinc-200"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-black/5 transition-transform duration-200 ${
            enabled ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
