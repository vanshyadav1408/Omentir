"use client";

import { useEffect, useMemo, useState } from "react";
import {
  avatarImgCandidates,
  durableLeadAvatarUrl,
  durableLeadAvatarUrlWithRetry,
  personInitials,
} from "@/lib/lead-avatar";

const DURABLE_RETRY_LIMIT = 8;

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
  const [failed, setFailed] = useState<string[]>([]);
  const [durableRetry, setDurableRetry] = useState(0);
  const candidates = useMemo(() => {
    const list = avatarImgCandidates({ leadId, avatarUrl });
    const durable = durableLeadAvatarUrl(leadId);
    const retried = durableLeadAvatarUrlWithRetry(leadId, durableRetry);
    if (!durable || !retried || durableRetry <= 0) return list;
    return list.map((candidate) => (candidate === durable ? retried : candidate));
  }, [leadId, avatarUrl, durableRetry]);
  const candidateKey = candidates.join("\n");
  const src = candidates.find((candidate) => !failed.includes(candidate));
  const durable = durableLeadAvatarUrlWithRetry(leadId, durableRetry);

  useEffect(() => {
    setFailed([]);
  }, [candidateKey]);

  useEffect(() => {
    setDurableRetry(0);
  }, [leadId, avatarUrl]);

  useEffect(() => {
    if (src || !durable || durableRetry >= DURABLE_RETRY_LIMIT) return;
    if (!failed.includes(durable)) return;
    const timeout = window.setTimeout(() => {
      setDurableRetry((current) => current + 1);
    }, 4000 * 2 ** Math.min(durableRetry, 2));
    return () => window.clearTimeout(timeout);
  }, [src, durable, failed, durableRetry]);

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
