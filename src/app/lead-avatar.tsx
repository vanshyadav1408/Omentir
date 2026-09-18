"use client";

import { useEffect, useState } from "react";
import {
  durableLeadAvatarUrl,
  httpsAvatarUrl,
  isExpiredLinkedInMediaUrl,
  personInitials,
  proxiedAvatarUrl,
} from "@/lib/lead-avatar";

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
  const durable = durableLeadAvatarUrl(leadId);
  const raw = httpsAvatarUrl(avatarUrl);
  const direct = raw && !isExpiredLinkedInMediaUrl(raw) ? raw : undefined;
  const proxy = direct ? proxiedAvatarUrl(direct) : undefined;
  const [failedDurable, setFailedDurable] = useState("");
  const [failedDirect, setFailedDirect] = useState("");
  const [failedSrc, setFailedSrc] = useState("");
  const src =
    durable && failedDurable !== durable
      ? durable
      : direct && failedDirect === direct
        ? proxy
        : direct || (durable ? undefined : proxy);

  useEffect(() => {
    setFailedDurable("");
    setFailedDirect("");
    setFailedSrc("");
  }, [durable, direct]);

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
          onError={() => {
            if (durable && src === durable) {
              setFailedDurable(durable);
              return;
            }
            if (direct && src === direct && proxy && proxy !== direct) {
              setFailedDirect(direct);
              return;
            }
            setFailedSrc(src);
          }}
        />
      ) : null}
    </span>
  );
}
