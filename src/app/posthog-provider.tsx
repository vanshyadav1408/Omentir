'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  ATTRIBUTION_COOKIE,
  attributionProperties,
  cookieHeaderValue,
  rememberVisit,
} from '@/lib/referral-attribution'
import { googleClickSignals } from '@/lib/referral-channel'
import { watchSupportWidgetGreeting } from '@/lib/posthog-support'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
let posthogInitialized = false

function readAttributionCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const prefix = `${ATTRIBUTION_COOKIE}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length)
  }
  return undefined
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogClient = usePostHog()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || !posthogClient) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    if (url === lastPath.current) return
    lastPath.current = url

    const pageUrl = window.location.href
    const attribution = rememberVisit(pageUrl, document.referrer, readAttributionCookie())
    document.cookie =
      cookieHeaderValue(attribution) + (window.location.protocol === "https:" ? "; Secure" : "")
    const properties = attributionProperties(attribution)
    const googleSignals = googleClickSignals(pageUrl, document.referrer)

    posthogClient.capture('$pageview', {
      $current_url: pageUrl,
      ...properties,
      ...googleSignals,
      $set: {
        channel: properties.channel,
        channel_name: properties.channel_name,
        referring_domain: properties.referring_domain,
      },
      $set_once: {
        initial_channel: properties.initial_channel,
        initial_channel_name: properties.initial_channel_name,
        initial_referring_domain: properties.initial_referring_domain,
        initial_landing_path: properties.initial_landing_path,
      },
    })
  }, [pathname, searchParams, posthogClient])

  return null
}

function PostHogIdentify() {
  const { userId, isSignedIn } = useAuth()
  const { user } = useUser()
  const posthogClient = usePostHog()
  const identified = useRef<string | null>(null)

  useEffect(() => {
    if (!posthogClient || !isSignedIn || !userId) return
    const email = user?.primaryEmailAddress?.emailAddress
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    const identityKey = `${userId}:${email ?? ''}:${name}`
    if (identified.current === identityKey) return
    identified.current = identityKey
    posthogClient.identify(userId, {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    })
  }, [posthogClient, isSignedIn, userId, user])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!posthogKey || posthogInitialized) return

    posthog.init(posthogKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      ui_host: 'https://us.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
    })
    posthogInitialized = true
  }, [])

  useEffect(() => {
    if (!posthogKey) return
    return watchSupportWidgetGreeting()
  }, [])

  if (!posthogKey) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
        <PostHogIdentify />
      </Suspense>
      {children}
    </PHProvider>
  )
}
