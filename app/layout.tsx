import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "@/components/AnalyticsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KVITY.INFO — квіти поруч з тобою",
    template: "%s | KVITY.INFO",
  },
  description:
    "KVITY.INFO — маркетплейс квіткових магазинів. Знайди квіти, букети та композиції у своєму місті: Київ, Львів, Івано-Франківськ.",
  keywords: [
    "квіти",
    "букети",
    "квітковий магазин",
    "доставка квітів",
    "купити квіти",
    "квіти Київ",
    "квіти Львів",
    "квіти Івано-Франківськ",
  ],
  metadataBase: new URL("https://kvity.info"),
  verification: {
  google:"vziwhgHaPbYdpq-Yw7oat4Ir6AeEAv1-pO4kU6DfiU4"
},
  openGraph: {
    title: "KVITY.INFO — квіти поруч з тобою",
    description:
      "Маркетплейс квіткових магазинів. Обирай квіти за ціною, фото та відстанню.",
    url: "https://kvity.info",
    siteName: "KVITY.INFO",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KVITY.INFO — маркетплейс квітів",
      },
    ],
    locale: "uk_UA",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="uk">
      {/* ✅ GA скрипти краще в <head> */}
      <head>
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        ) : null}
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ✅ Відстеження переходів між сторінками */}
        <AnalyticsProvider />

        {/* ✅ ЄДИНИЙ ХЕДЕР */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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
          </div>
        </header>

        {/* ✅ Контент сторінок */}
        {children}
      </body>
    </html>
  );
}
