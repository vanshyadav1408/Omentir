import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist_Mono, Google_Sans, Roboto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { defaultDescription, defaultKeywords, defaultOgImage, siteUrl } from "./seo";
import NavigationFeedback from "./navigation-feedback";
import { PostHogProvider } from "./posthog-provider";
import {
  THEME_RESOLVED_COOKIE,
  THEME_STORAGE_KEY,
  resolveThemeFromCookies,
} from "./theme-init-script";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast";
import { isLocalMode } from "@/lib/runtime-mode";
import "./globals.css";

/* Primary UI faces: Google Sans (display/UI) + Roboto (body). Geist Mono kept for code.
   Google Sans has no size-adjust metrics in next/font yet — disable auto fallback
   override generation so the build doesn't warn on every compile. */
const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  adjustFontFallback: false,
  fallback: ["Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Omentir",
  title: "Omentir - Find customers with AI",
  description: defaultDescription,
  keywords: defaultKeywords,
  authors: [{ name: "Omentir" }],
  creator: "Omentir",
  publisher: "Omentir",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Omentir - Find customers with AI",
    description: defaultDescription,
    url: "/",
    siteName: "Omentir",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Omentir - Find customers with AI",
    description: defaultDescription,
    images: [defaultOgImage.url],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const resolvedTheme = resolveThemeFromCookies({
    preference: cookieStore.get(THEME_STORAGE_KEY)?.value,
    resolved: cookieStore.get(THEME_RESOLVED_COOKIE)?.value,
  });
  const isDark = resolvedTheme === "dark";
  const localMode = isLocalMode();

  const application = (
    <ThemeProvider>
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
    </ThemeProvider>
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${googleSans.variable} ${roboto.variable} ${geistMono.variable} antialiased${isDark ? " dark" : ""}`}
      data-theme={resolvedTheme}
      style={
        {
          colorScheme: resolvedTheme,
          /* Legacy tokens → M3 primary face so existing inline styles keep working */
          ["--font-varta" as string]: "var(--font-google-sans)",
          ["--font-geist-sans" as string]: "var(--font-google-sans)",
        } as CSSProperties
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols Outlined (variable: opsz/wght/FILL/GRAD) — M3 icon system */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* ClerkProvider inside body avoids Next 16 / Turbopack races where the
            provider wraps <html> before hydration and Clerk UI chunks stall. */}
        {localMode ? application : <ClerkProvider
          signInUrl="/login"
          signUpUrl="/signup"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
          afterSignOutUrl="/"
        >
          {application}
        </ClerkProvider>}
      </body>
    </html>
  );
}
