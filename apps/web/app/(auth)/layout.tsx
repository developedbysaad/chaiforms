import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-chai-200 bg-chai-50/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <Link href="/" className="display text-xl font-bold text-chai-900">
            🍵 ChaiForm
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
