"use client";

import { useState } from "react";
import { displayAvatarUrl, personInitials } from "@/lib/lead-avatar";

export function LeadAvatar({
  name,
  avatarUrl,
  className,
  initialsClassName,
}: {
  name: string;
  avatarUrl?: string;
  className: string;
  initialsClassName: string;
}) {
  const src = displayAvatarUrl(avatarUrl);
  const [failedSrc, setFailedSrc] = useState("");

  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}>
      <span className={initialsClassName}>{personInitials(name)}</span>
      {src && failedSrc !== src ? (
        // LinkedIn CDN URLs are not in next/image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : null}
    </span>
  );
}
