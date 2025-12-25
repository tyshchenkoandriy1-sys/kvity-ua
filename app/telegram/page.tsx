"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function makeCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function TelegramConnectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // сюди впиши свій @бот (без @ теж ок)
  const botUsername = useMemo(() => "kvity_orders_bot", []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data: sess } = await supabase.auth.getSession();
      const user = sess?.session?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: prof, error: pe } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (pe || !prof) {
        setError("Не вдалося завантажити профіль.");
        setLoading(false);
        return;
      }

      setRole(prof.role);

      if (prof.role !== "seller") {
        setError("Підключення Telegram доступне тільки продавцю (seller).");
        setLoading(false);
        return;
      }

      // генеруємо/оновлюємо код (діє 10 хв)
      const newCode = makeCode(6);
      const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: upErr } = await supabase
        .from("telegram_link_codes")
        .upsert({ shop_id: prof.id, code: newCode, expires_at: exp });

      if (upErr) {
        setError("Не вдалося створити код: " + upErr.message);
        setLoading(false);
        return;
      }

      setCode(newCode);
      setExpiresAt(exp);
      setLoading(false);
    };

    run();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-700">Завантаження...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Telegram-сповіщення</h1>
          <p className="mt-2 text-sm text-slate-700">
            Привʼяжи Telegram, щоб отримувати <span className="font-semibold">термінові</span> повідомлення
            про нові замовлення.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!error && (
            <>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-800">
                  1) Відкрий бота в Telegram:
                </p>
                <a
                  className="mt-2 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  href={`https://t.me/${botUsername.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Відкрити бота
                </a>

                <p className="mt-4 text-sm text-slate-800">
                  2) Відправ боту команду:
                </p>

                <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900">
                  /link {code}
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  Код дійсний до: {expiresAt ? new Date(expiresAt).toLocaleString("uk-UA") : "—"}
                </p>
              </div>
            </>
          )}

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            ← Назад у кабінет
          </button>

          <p className="mt-3 text-[11px] text-slate-600">
            Роль: <span className="font-semibold">{role ?? "—"}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
