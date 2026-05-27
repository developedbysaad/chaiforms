import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// ChaiForm documentation site (Astro + Starlight).
// Served under the `/docs` path: in production the API server serves the static
// build at /docs (the Scalar API reference moved to /api/docs). `base: "/docs"`
// makes every asset + link resolve under that prefix.
export default defineConfig({
  site: process.env.PUBLIC_APP_URL || "https://chaiforms.developedbysaad.com",
  base: "/docs",
  integrations: [
    starlight({
      title: "ChaiForm Docs",
      description: "Open-source form builder. Fuelled entirely by chai.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/developedbysaad/chaiforms",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Local development", slug: "guides/local-development" },
            { label: "Deployment", slug: "guides/deployment" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Environment variables", slug: "reference/environment" },
            { label: "Architecture", slug: "reference/architecture" },
            { label: "API reference (Scalar)", link: "/api/docs", attrs: { target: "_blank" } },
          ],
        },
      ],
    }),
  ],
});
