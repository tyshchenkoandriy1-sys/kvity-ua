import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KVITY.INFO",
  description: "Маркетплейс квіткових магазинів",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ✅ ЄДИНИЙ ХЕДЕР */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            {/* Logo (прямокутний) */}
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="KVITY.INFO"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                KVITY.INFO
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/flowers"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Каталог
              </Link>
              <Link
                href="/sales"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Знижки та акції
              </Link>
              <Link
                href="/partner"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Для магазинів
              </Link>
            </nav>

            {/* Actions */}
           
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
