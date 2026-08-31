import type { CSSProperties } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { ICON_FONT_URL } from "./icon-font-url";
import { defaultDescription, defaultKeywords, defaultOgImage, defaultTitle, siteUrl } from "./seo";
import NavigationFeedback from "./navigation-feedback";
import { PostHogProvider } from "./posthog-provider";
import { buildEarlyFetchScript } from "./sidebar-early-fetch";
import { ToastProvider } from "./toast";
import { isLocalMode } from "@/lib/runtime-mode";
import { studioHostRedirectScript } from "@/sanity/studio-host";
import "./globals.css";

/* Primary UI faces: Google Sans (display/UI) + Roboto (body). Geist Mono kept for code.
   Google Sans has no size-adjust metrics in next/font yet — disable auto fallback
   override generation so the build doesn't warn on every compile. */
const googleSans = localFont({
  src: "./fonts/google-sans-latin.woff2",
  variable: "--font-google-sans",
  weight: "400 700",
  adjustFontFallback: false,
  fallback: ["Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

const roboto = localFont({
  src: "./fonts/roboto-latin.woff2",
  variable: "--font-roboto",
  weight: "400 700",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Omentir",
  title: defaultTitle,
  description: defaultDescription,
  keywords: defaultKeywords,
  authors: [{ name: "Omentir" }],
  creator: "Omentir",
  publisher: "Omentir",
  alternates: {
    canonical: "/",
    types: {
      "text/plain": [
        { url: "/llms.txt", title: "llms.txt" },
        { url: "/llms-full.txt", title: "llms-full.txt" },
      ],
      "text/markdown": [{ url: "/index.md", title: "Markdown" }],
    },
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: "/",
    siteName: "Omentir",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultOgImage.url],
  },
  other: {
    "ory-verify": "orynth-480c700439eb4a8790b21af5a538ba16",
  },
  // Google Search reads rel=icon on the homepage. Files live in public/ at
  // stable paths. Do not put favicon.ico or icon.png in src/app/: Next hashes
  // those to /favicon.ico?<hash> and tags them sizes=48x48, which is below
  // Google's recommended size and changes URL on rebuilds.
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localMode = isLocalMode();

  const application = (
    <ToastProvider>
      {localMode ? (
        <>
          <NavigationFeedback />
          {children}
        </>
      ) : (
        <PostHogProvider>
          <NavigationFeedback />
          {children}
        </PostHogProvider>
      )}
    </ToastProvider>
  );

  return (
    // Dark is the only theme: there is no preference to read, nothing to
    // resolve per request, and no window where an unstyled light paint can
    // appear. `dark` + data-theme are both set because the stylesheet keys off
    // either one.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${googleSans.variable} ${roboto.variable} ${geistMono.variable} antialiased dark`}
      data-theme="dark"
      style={
        {
          colorScheme: "dark",
          /* Legacy tokens → M3 primary face so existing inline styles keep working */
          ["--font-varta" as string]: "var(--font-google-sans)",
          ["--font-geist-sans" as string]: "var(--font-google-sans)",
        } as CSSProperties
      }
    >
      <head>
        {/* llmstxt.org v2: describedby points agents at the site-wide index
            that covers every public path. */}
        <link rel="describedby" href={`${siteUrl}/llms.txt`} title="llms.txt" />
        {/* Material Symbols Outlined (variable: opsz/wght/FILL/GRAD) — M3 icon
            system. Self-hosted subset (~50KB) instead of Google's ~4MB font:
            the CDN version cost two extra origin handshakes plus a stylesheet
            round-trip before the font request even started, and font-display
            block held every icon invisible until it finished. Preloaded so the
            fetch starts with the HTML rather than after CSS parses. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href={ICON_FONT_URL}
          crossOrigin="anonymous"
        />
        {/* Starts the current page's sidebar-data reads while the HTML is still
            parsing, so they are in flight (often finished) before the bundle has
            even hydrated. Lives here rather than in the pages it serves: React
            does not execute an inline script it creates on the client, and the
            root layout is the only node guaranteed to be hydrated instead of
            re-created. See sidebar-early-fetch. */}
        <script dangerouslySetInnerHTML={{ __html: studioHostRedirectScript() }} />
        <script dangerouslySetInnerHTML={{ __html: buildEarlyFetchScript() }} />
      </head>
      <body className="app-compact flex min-h-screen flex-col">
        {/* ClerkProvider inside body avoids Next 16 / Turbopack races where the
            provider wraps <html> before hydration and Clerk UI chunks stall.
            prefetchUI={false}: this app uses custom login/signup (window.Clerk /
            control APIs), not <SignIn/> / <SignUp/>. Prefetching @clerk/ui on
            every page made Turbopack hydrate race the UI renderer and log
            "[Clerk UI] Component renderer did not mount within 10s". UI still
            loads on demand when bot-protection captcha needs it. */}
        {localMode ? application : <ClerkProvider
          signInUrl="/login"
          signUpUrl="/signup"
          signInFallbackRedirectUrl="/overview"
          signUpFallbackRedirectUrl="/onboarding"
          afterSignOutUrl="/"
          prefetchUI={false}
        >
          {application}
        </ClerkProvider>}
      </body>
    </html>
  );
}
