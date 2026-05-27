import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-chai-200 bg-chai-50/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="display text-xl font-bold text-chai-900">
            🍵 ChaiForm
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/explore" className="text-chai-900 hover:text-chai-500">Explore</Link>
            <Link href="/templates" className="text-chai-900 hover:text-chai-500">Templates</Link>
            <Link href="/pricing" className="text-chai-900 hover:text-chai-500">Pricing</Link>
            <Link href="/open-source" className="text-chai-900 hover:text-chai-500">Open Source</Link>
            <Link href="/docs" className="text-chai-900 hover:text-chai-500">Docs</Link>
            <a href="/api/docs" className="text-chai-900 hover:text-chai-500">API</a>
            <Link href="/login" className="text-chai-900 hover:text-chai-500">Login</Link>
            <Link href="/register" className="btn btn-primary text-sm">Get started</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-chai-200 bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-chai-700">
          <div>
            Made with 🍵 by{" "}
            <a
              href="https://x.com/developedbysaad"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-chai-900 hover:text-chai-500"
            >
              Saad
            </a>
          </div>
          <div className="flex gap-4">
            <Link href="/open-source">Open source</Link>
            <a href={process.env.NEXT_PUBLIC_GITHUB_URL ?? "#"} target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://x.com/developedbysaad" target="_blank" rel="noreferrer">X</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
