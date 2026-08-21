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
  "/contact/:path*",
  "/dashboard/:path*",
  "/overview/:path*",
  "/leads/:path*",
  "/login/:path*",
  "/logout/:path*",
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
  "/page-markdown/:path*",
];

const nextConfig: NextConfig = {
  output: "standalone",
  // CI runs `tsc --noEmit` before every production deploy. Repeating the same
  // check inside `next build` exhausted the VPS during the TypeScript phase and
  // left a partial `.next` directory serving HTML with missing client chunks.
  typescript: { ignoreBuildErrors: true },
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
  // Next's app router does not serve a `.well-known` directory, but OAuth
  // discovery is defined at fixed well-known paths and clients will not look
  // anywhere else. RFC 9728 also allows the resource path to be appended to the
  // metadata URL, so both the bare and suffixed forms must resolve.
  async rewrites() {
    return [
      { source: "/.well-known/oauth-protected-resource", destination: "/api/oauth/metadata/protected-resource" },
      { source: "/.well-known/oauth-protected-resource/:path*", destination: "/api/oauth/metadata/protected-resource" },
      { source: "/.well-known/oauth-authorization-server", destination: "/api/oauth/metadata/authorization-server" },
      { source: "/.well-known/oauth-authorization-server/:path*", destination: "/api/oauth/metadata/authorization-server" },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/overview", permanent: true },
      { source: "/dashboard/:path*", destination: "/overview/:path*", permanent: true },
      { source: "/for-agents", destination: "/features/agent-api-and-mcp", permanent: true },
      { source: "/mcp-server", destination: "/integrations/mcp", permanent: true },
    ];
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
        // /oauth/* is excluded and handled below: the consent form's whole job is
        // to hand the browser back to the AI app that started the flow, and
        // `form-action 'self'` is enforced against redirect targets in some
        // browsers, which would strand the user on a blocked page mid-connect.
        source: "/((?!_next/|oauth/).*)",
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
      {
        // Same protections as every other page, minus the form-action limit.
        source: "/oauth/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Static fonts under public/ don't get Next's content-hashed filenames,
        // so they'd otherwise be revalidated on every navigation. The icon font
        // carries a ?v=<content hash> that scripts/build-icon-font.mjs bumps
        // whenever the glyph set changes, which makes immutable safe here.
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
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
          source: "/((?!_next|api|fonts).*)",
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
