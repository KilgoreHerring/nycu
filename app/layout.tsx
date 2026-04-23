import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: "News You Can Use",
  description:
    "Fortnightly intelligence on legal AI - the market, the research, and the practitioners.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-full antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="px-6 pt-8 md:pt-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="group inline-flex items-baseline gap-3">
          <span className="font-display text-2xl md:text-3xl text-[#142028] tracking-tight">
            News You Can <span className="font-display-italic text-[#3a7d78]">Use</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[#1f2a33]">
          <Link
            href="/"
            className="hover:text-[#8a4a30] transition-colors"
          >
            Current
          </Link>
          <Link
            href="/archive"
            className="hover:text-[#8a4a30] transition-colors"
          >
            Archive
          </Link>
          <Link
            href="/about"
            className="hover:text-[#8a4a30] transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
      <div className="max-w-6xl mx-auto mt-6 brush-rule" aria-hidden />
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="px-6 pt-16 pb-10 mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="brush-rule mb-8" aria-hidden />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-[#5b6f7d]">
          <p className="font-display-italic text-lg text-[#3a7d78]">
            News You Can Use - a fortnightly field note from the legal AI frontier.
          </p>
          <p>Edited by Mike Kennedy.</p>
        </div>
      </div>
    </footer>
  );
}
