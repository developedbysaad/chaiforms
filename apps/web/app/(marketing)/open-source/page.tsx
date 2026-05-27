import Link from "next/link";

export default function OpenSourcePage() {
  const donateUrl = process.env.NEXT_PUBLIC_RAZORPAY_DONATE_LINK ?? "#";
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL ?? "#";
  const twitterUrl = process.env.NEXT_PUBLIC_TWITTER_URL ?? "#";
  const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "#";

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="display text-5xl font-bold text-chai-900">Free. Forever. No gotcha.</h1>
      <p className="text-lg text-chai-700 mt-6">
        ChaiForm is open source. Fork it, self-host it, break it, fix it. If it saves you time, buy
        Saad a chai.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-10">
        <a href={githubUrl} target="_blank" rel="noreferrer" className="card hover:shadow-md transition-shadow">
          <div className="text-2xl">⭐</div>
          <div className="font-bold mt-2">Star on GitHub</div>
          <div className="text-sm text-chai-700">It actually helps. Algorithms care about this stuff.</div>
        </a>
        <a href={donateUrl} target="_blank" rel="noreferrer" className="card bg-chai-500 text-white hover:shadow-md transition-shadow">
          <div className="text-2xl">☕</div>
          <div className="font-bold mt-2">Buy me a chai — ₹99</div>
          <div className="text-sm opacity-90">Razorpay payment link. No login. No card store. Just chai.</div>
        </a>
        <a href={twitterUrl} target="_blank" rel="noreferrer" className="card hover:shadow-md transition-shadow">
          <div className="text-2xl">𝕏</div>
          <div className="font-bold mt-2">Follow on X</div>
          <div className="text-sm text-chai-700">Where ChaiForm gets roasted before it ships.</div>
        </a>
        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="card hover:shadow-md transition-shadow">
          <div className="text-2xl">💼</div>
          <div className="font-bold mt-2">LinkedIn</div>
          <div className="text-sm text-chai-700">For the polite version of the same content.</div>
        </a>
      </div>

      <div className="mt-16">
        <h2 className="display text-2xl font-bold mb-4">Everything. Included. Always.</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-chai-200">
              <th className="text-left py-2 font-semibold">Feature</th>
              <th className="text-right py-2 font-semibold">ChaiForm</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Unlimited forms", "✓"],
              ["Unlimited responses", "✓"],
              ["10 themes (and counting)", "✓"],
              ["Conditional logic", "✓"],
              ["CSV export", "✓"],
              ["Password protection", "✓"],
              ["Custom slug", "✓"],
              ["QR code share", "✓"],
              ["API endpoint forms", "✓"],
              ["Honeypot + captcha", "✓"],
              ["Webhooks (signed)", "✓"],
              ["Self-host with Kamal", "✓"],
            ].map(([feature, value]) => (
              <tr key={feature} className="border-b border-chai-100">
                <td className="py-2">{feature}</td>
                <td className="py-2 text-right text-chai-500 font-bold">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-12 text-chai-700 text-sm">
        Looking for the docs?{" "}
        <Link href="/docs" className="underline">
          API reference
        </Link>{" "}
        is live.
      </p>
    </section>
  );
}
