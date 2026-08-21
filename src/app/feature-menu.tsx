import Link from "next/link";
import FeatureIcon from "./feature-icon";
import { FEATURE_NAV_ITEMS } from "./feature-nav";

/** Desktop feature navigation. Five columns, three rows for the current set. */
export default function FeatureMenu() {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="m3-state-layer flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 transition-colors hover:text-[var(--md-sys-color-on-surface)]"
      >
        Features
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform duration-150 group-hover:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className="invisible fixed left-1/2 top-12 z-[120] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 pt-4 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <ul className="grid scale-95 grid-cols-2 gap-1.5 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-2 shadow-[var(--md-sys-elevation-3)] transition-transform duration-150 group-focus-within:scale-100 group-hover:scale-100 lg:grid-cols-5">
          {FEATURE_NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="m3-state-layer flex h-full min-h-14 items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 font-semibold leading-5 text-[var(--md-sys-color-on-surface)] transition-colors hover:border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center text-black dark:text-white">
                  <FeatureIcon icon={item.icon} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
