'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
let posthogInitialized = false

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
    posthogClient.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams, posthogClient])

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

  if (!posthogKey) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
