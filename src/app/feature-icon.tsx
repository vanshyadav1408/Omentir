import type { FeatureNavIcon } from "./feature-nav";

export default function FeatureIcon({ icon }: { icon: FeatureNavIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
    >
      {icon === "target" ? (
        <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M22 12h-3" /></>
      ) : icon === "message" ? (
        <><path d="M4 5h16v12H8l-4 3V5Z" /><path d="m14.5 8 .6 1.4L16.5 10l-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4Z" /><path d="M7.5 13.5h4" /></>
      ) : icon === "search" ? (
        <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" /></>
      ) : icon === "inbox" ? (
        <><path d="M5 4h14l3 10v6H2v-6L5 4Z" /><path d="M2.5 14H8l2 3h4l2-3h5.5" /></>
      ) : icon === "network" ? (
        <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="17" r="2.5" /><circle cx="19" cy="17" r="2.5" /><path d="m10.7 7.2-4.4 7.6M13.3 7.2l4.4 7.6M7.5 17h9" /></>
      ) : icon === "product" ? (
        <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21" /></>
      ) : icon === "send" ? (
        <><path d="m3 11 18-8-7.5 18-2.2-7.3L3 11Z" /><path d="m11.3 13.7 4.2-4.2" /></>
      ) : icon === "shield" ? (
        <><path d="M12 3 20 6v5c0 5.2-3.2 8.4-8 10-4.8-1.6-8-4.8-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>
      ) : icon === "people" ? (
        <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.3" /><path d="M3.5 19c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5M14.5 14.5c3.2-.4 5.2 1 6 4" /></>
      ) : (
        <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" /></>
      )}
    </svg>
  );
}
