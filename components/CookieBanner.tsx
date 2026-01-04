"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "kvity_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setVisible(true);
  }, []);

  const accept = () => {
  localStorage.setItem("cookie_consent", "accepted");
  setVisible(false);
  window.location.reload();
};


  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-800">
          Ми використовуємо cookies для аналітики та покращення роботи сайту.{" "}
          <Link href="/cookies" className="font-semibold text-pink-600 hover:text-pink-700">
            Детальніше
          </Link>
          .
        </p>

        <div className="flex gap-2">
          <button
            onClick={accept}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Прийняти
          </button>
        </div>
      </div>
    </div>
  );
}
