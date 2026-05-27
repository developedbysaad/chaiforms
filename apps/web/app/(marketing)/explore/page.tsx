import type { RouterOutputs } from "@repo/trpc/client";
import Link from "next/link";

import { api } from "@/lib/trpc-server";
import { applyThemeVars } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  let items: RouterOutputs["public"]["listPublicForms"]["items"] = [];
  try {
    const res = await api.public.listPublicForms.query({ limit: 24, search: searchParams.q });
    items = res.items;
  } catch {
    // DB not configured — render empty state
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="display text-4xl font-bold">Explore</h1>
          <p className="text-chai-700 mt-2">Public forms built by the community. Open-source vibes, public visibility.</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={searchParams.q} placeholder="Search…" className="input w-64" />
          <button className="btn btn-ghost">Search</button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-16 text-chai-700">
          <div className="text-3xl mb-2">🫖</div>
          <p>No public forms yet. <Link href="/register" className="underline">Make one</Link>.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((f: (typeof items)[number]) => {
            const theme = f.theme?.config;
            return (
              <Link
                key={f.id}
                href={`/f/${f.slug}`}
                className="rounded-2xl border p-5 transition-transform hover:-translate-y-0.5"
                style={
                  theme
                    ? {
                        ...applyThemeVars(theme),
                        background: theme.background,
                        color: theme.text,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.border,
                      }
                    : {}
                }
              >
                <div className="text-2xl mb-2">{theme?.logoEmoji ?? "📝"}</div>
                <div className="font-bold text-lg">{f.title}</div>
                <div className="text-sm opacity-70 mt-1 line-clamp-2">{f.description}</div>
                <div className="text-xs mt-4 opacity-70">
                  {f.responseCount} responses · {f.theme?.name}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
