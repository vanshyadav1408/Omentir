'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { hostedSupportEmail } from '@/lib/hosted-identity'
import { useHydrated } from './use-hydrated'

const PANEL =
  'fixed z-[250] rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] text-sm text-[var(--md-sys-color-on-surface)] shadow-[0_8px_24px_rgba(0,0,0,0.35)]'

// PostHog stores the visitor's answer itself (get_explicit_consent_status), so
// there is no second copy of the choice to keep in sync. Until they accept,
// PostHog runs cookieless (see cookieless_mode in posthog-provider), and in
// that mode it refuses to load the support chat widget.
export function CookieBanner() {
  const posthogClient = usePostHog()
  const hydrated = useHydrated()
  const [answer, setAnswer] = useState<'denied' | null>(null)

  if (!hydrated) return null
  const consent = answer ?? posthogClient.get_explicit_consent_status()

  const decide = (accepted: boolean) => {
    if (accepted) {
      posthogClient.opt_in_capturing()
      // Opting in resets PostHog, which drops the chat widget's remote config,
      // and nothing public fetches it again (posthog-js 1.424). One reload is
      // the only reliable way to show the widget now.
      window.location.reload()
      return
    }
    posthogClient.opt_out_capturing()
    setAnswer('denied')
  }

  if (consent === 'pending') {
    return (
      <div
        role="region"
        aria-label="Cookie consent"
        className={`${PANEL} inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] p-4 sm:inset-x-auto sm:left-4 sm:max-w-sm`}
      >
        <p className="leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
          We use cookies for product analytics, the support chat, and to remember which link
          brought you here. If you decline, we still count page views, just without cookies.{' '}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-[var(--md-sys-color-on-surface)]">
            Privacy policy
          </Link>
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => decide(false)} className="m3-btn m3-btn-outlined flex-1">
            Decline
          </button>
          <button type="button" onClick={() => decide(true)} className="m3-btn m3-btn-filled flex-1">
            Accept
          </button>
        </div>
      </div>
    )
  }

  if (consent === 'denied') return <SupportWithoutCookies onAllow={() => decide(true)} />
  return null
}

// Stands in for the chat launcher after a decline, so support is still one
// click away.
function SupportWithoutCookies({ onAllow }: { onAllow: () => void }) {
  const [open, setOpen] = useState(false)
  const email = hostedSupportEmail()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="m3-btn m3-btn-filled fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[250] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      >
        Support
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Support"
      className={`${PANEL} bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 w-[min(20rem,calc(100vw-2rem))] p-4`}
    >
      <p className="leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
        The chat needs cookies to keep your conversation, and you declined them. Allow cookies to
        open it, or email us at{' '}
        <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-[var(--md-sys-color-on-surface)]">
          {email}
        </a>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="m3-btn m3-btn-outlined flex-1">
          Close
        </button>
        <button type="button" onClick={onAllow} className="m3-btn m3-btn-filled flex-1">
          Allow cookies
        </button>
      </div>
    </div>
  )
}
