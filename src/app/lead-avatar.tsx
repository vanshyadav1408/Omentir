"use client";

import { useEffect, useState } from "react";
import { httpsAvatarUrl, personInitials, proxiedAvatarUrl } from "@/lib/lead-avatar";

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
  const direct = httpsAvatarUrl(avatarUrl);
  const proxy = direct ? proxiedAvatarUrl(direct) : undefined;
  const [failedDirect, setFailedDirect] = useState("");
  const [failedSrc, setFailedSrc] = useState("");
  const src =
    direct && failedDirect === direct ? proxy : direct;

  useEffect(() => {
    setFailedDirect("");
    setFailedSrc("");
  }, [direct]);

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
