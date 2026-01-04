"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie_consent";

export default function GaAfterConsent() {
  const [allowed, setAllowed] = useState(false);
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "accepted") setAllowed(true);

    const onStorage = () => {
      const now = localStorage.getItem(STORAGE_KEY);
      setAllowed(now === "accepted");
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}
