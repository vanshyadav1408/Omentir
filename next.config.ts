import type { NextConfig } from "next";

const privateIndexingRoutes = [
  "/actions/:path*",
  "/activity/:path*",
  "/agents/:path*",
  "/api-keys/:path*",
  "/api/:path*",
  "/billing/manage/:path*",
  "/campaigns/:path*",
  "/checkout/:path*",
  "/connect/:path*",
  "/dashboard/:path*",
  "/leads/:path*",
  "/login/:path*",
  "/messages/:path*",
  "/my-product/:path*",
  "/new-user-experience/:path*",
  "/onboarding/:path*",
  "/reconnect/:path*",
  "/settings/:path*",
  "/setup/:path*",
  "/signup/:path*",
  "/sso-callback/:path*",
  "/subscription-creation-successful/:path*",
  "/upgrade/:path*",
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Next dev blocks HMR / dev-resource requests from any origin not listed here
  // (a blocked /_next/webpack-hmr socket stalls the Turbopack client and stops
  // the app from hydrating). Always allow loopback; add extra origins — e.g. a
  // Cloudflare tunnel hostname — via ALLOWED_DEV_ORIGINS so none are hardcoded.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "[::1]",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? []),
  ],
  experimental: {
    // Message attachments post through a server action; the default 1MB
    // body limit rejects them.
    serverActions: { bodySizeLimit: "20mb" },
  },
  async headers() {
    const responseHeaders = [
      {
        // Anti-clickjacking: prevent the app from being framed by any origin.
        // Exclude /_next/* : matching it injects these headers onto the dev
        // HMR WebSocket's 101 response, which browsers reject as
        // ERR_INVALID_HTTP_RESPONSE — that breaks the dev client bootstrap and
        // stops the whole app from hydrating. Framing/CSP headers only matter
        // for document responses, not Next's static assets or dev sockets.
        source: "/((?!_next/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
          // Stop browsers from MIME-sniffing responses into an unexpected type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Do not leak full URLs (which can carry ids) to third-party origins.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      ...privateIndexingRoutes.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];

    if (process.env.NODE_ENV === "development") {
      responseHeaders.push(
        {
          // Turbopack reuses dev chunk URLs. Any reverse proxy or CDN in front of
          // the dev server must not cache them, or HTML can hydrate against a
          // stale client bundle. Scope this to /_next/static only: matching all of
          // /_next/:path* also clobbers dev internals like the /_next/webpack-hmr
          // WebSocket (breaking HMR and stalling hydration), and a plain
          // Cache-Control here is what Next warns "can break dev behavior". The
          // CDN-only directives below tell the Cloudflare tunnel not to cache the
          // chunks without touching browser-facing caching or dev endpoints.
          source: "/_next/static/:path*",
          headers: [
            { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
            { key: "CDN-Cache-Control", value: "no-store" },
          ],
        },
        {
          // Document HTML carries streaming resume ids; stale cached HTML against
          // fresh chunks triggers client hydration failures.
          source: "/((?!_next|api).*)",
          headers: [
            { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
            { key: "CDN-Cache-Control", value: "no-store" },
            { key: "Cache-Control", value: "no-store" },
          ],
        },
      );
    }

    return responseHeaders;
  },
};

export default nextConfig;
