'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useHydrated } from './use-hydrated'

// PostHog stores the visitor's answer itself (get_explicit_consent_status), so
// there is no second copy of the choice to keep in sync. Until they accept,
// PostHog runs cookieless (see cookieless_mode in posthog-provider).
export function CookieBanner() {
  const posthogClient = usePostHog()
  const hydrated = useHydrated()
  const [answered, setAnswered] = useState(false)

  if (!hydrated || answered || posthogClient.get_explicit_consent_status() !== 'pending') return null

  const answer = (accepted: boolean) => {
    if (accepted) posthogClient.opt_in_capturing()
    else posthogClient.opt_out_capturing()
    setAnswered(true)
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[250] rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] p-4 text-sm text-[var(--md-sys-color-on-surface)] shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:left-4 sm:max-w-sm"
    >
      <p className="leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
        We use cookies for product analytics and to remember which link brought you here. If you
        decline, we still count page views, just without cookies.{' '}
        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-[var(--md-sys-color-on-surface)]">
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => answer(false)} className="m3-btn m3-btn-outlined flex-1">
          Decline
        </button>
        <button type="button" onClick={() => answer(true)} className="m3-btn m3-btn-filled flex-1">
          Accept
        </button>
      </div>
    </div>
  )
}
