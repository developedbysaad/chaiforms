/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The docs site (/docs, proxied to the api's static Starlight build) uses
  // trailing-slash URLs. Without this, Next's default trailing-slash redirect
  // ping-pongs against the static server's own redirect → an infinite loop.
  skipTrailingSlashRedirect: true,
  transpilePackages: ["@repo/trpc", "@repo/services", "@repo/database"],
  experimental: {
    serverComponentsExternalPackages: ["better-auth", "pg"],
  },
  async rewrites() {
    const api = process.env.API_INTERNAL_URL ?? "http://localhost:8000";
    return [
      // Health probe (Kamal proxy + Docker HEALTHCHECK) — proxied to the api so
      // a green check means both web AND api are up.
      { source: "/health", destination: `${api}/health` },
      { source: "/api/health", destination: `${api}/health` },
      { source: "/trpc/:path*", destination: `${api}/trpc/:path*` },
      { source: "/api/auth/:path*", destination: `${api}/api/auth/:path*` },
      // Google OAuth callback for the Sheets integration is served by the api.
      {
        source: "/api/integrations/:path*",
        destination: `${api}/api/integrations/:path*`,
      },
      { source: "/submit", destination: `${api}/submit` },
      {
        source: "/verify-access-key/:path*",
        destination: `${api}/verify-access-key/:path*`,
      },
      { source: "/openapi.json", destination: `${api}/openapi.json` },
      // API reference (Scalar) — relocated to /api/docs.
      { source: "/api/docs", destination: `${api}/api/docs` },
      { source: "/api/docs/:path*", destination: `${api}/api/docs/:path*` },
      // Documentation site (Astro + Starlight) served by the api at /docs.
      { source: "/docs", destination: `${api}/docs` },
      { source: "/docs/:path*", destination: `${api}/docs/:path*` },
      {
        source: "/forms/:formId/export.:format",
        destination: `${api}/forms/:formId/export.:format`,
      },
    ];
  },
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    return [
      {
        // Everything except public hosted forms: deny cross-origin framing
        // (anti-clickjacking for the dashboard, auth, and API surfaces).
        source: "/((?!f/).*)",
        headers: [
          ...common,
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      {
        // Public hosted forms at /f/<slug> are meant to be embedded anywhere
        // via the Share-panel iframe snippet. No X-Frame-Options here, and
        // CSP frame-ancestors * supersedes it for modern browsers.
        source: "/f/:slug*",
        headers: [
          ...common,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
