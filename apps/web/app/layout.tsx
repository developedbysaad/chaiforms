import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ChaiForm — Open source form builder",
  description:
    "Google Forms has the design sense of a tax return. Typeform costs more than your Netflix. ChaiForm is free, open source, beautiful, and fuelled entirely by chai.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
