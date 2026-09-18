"use client";

import { useEffect, useMemo, useState } from "react";
import { avatarImgCandidates, personInitials } from "@/lib/lead-avatar";

export function LeadAvatar({
  name,
  avatarUrl,
  leadId,
  className,
  initialsClassName,
}: {
  name: string;
  avatarUrl?: string;
  leadId?: string;
  className: string;
  initialsClassName: string;
}) {
  const candidates = useMemo(
    () => avatarImgCandidates({ leadId, avatarUrl }),
    [leadId, avatarUrl],
  );
  const candidateKey = candidates.join("\n");
  const [failed, setFailed] = useState<string[]>([]);
  const src = candidates.find((candidate) => !failed.includes(candidate));

  useEffect(() => {
    setFailed([]);
  }, [candidateKey]);

  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}>
      <span className={initialsClassName}>{personInitials(name)}</span>
      {src ? (
        // LinkedIn CDN URLs are not in next/image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => {
            setFailed((current) => (current.includes(src) ? current : [...current, src]));
          }}
        />
      ) : null}
    </span>
  );
}
