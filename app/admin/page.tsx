"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  role: string;
  shop_name: string | null;
  city: string | null;
  contact: string | null;
  address: string | null;
  created_at?: string | null;
};

export default function AdminPage() {
  const router = useRouter();

  const [me, setMe] = useState<Profile | null>(null);
  const [pending, setPending] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();

    if (sessionErr) {
      setError("Помилка сесії: " + sessionErr.message);
      setLoading(false);
      return;
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    // 1) Хто я
    const { data: myProfile, error: myErr } = await supabase
      .from("profiles")
      .select("id, role, shop_name, city, contact, address, created_at")
      .eq("id", session.user.id)
      .single();

    if (myErr || !myProfile) {
      setError("Не вдалося завантажити ваш профіль.");
      setLoading(false);
      return;
    }

    if (myProfile.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setMe(myProfile as Profile);

    // 2) Список pending магазинів
    const { data: pendingShops, error: pErr } = await supabase
      .from("profiles")
      .select("id, role, shop_name, city, contact, address, created_at")
      .eq("role", "pending")
      .order("created_at", { ascending: false });

    if (pErr) {
      setError("Не вдалося завантажити список pending-магазинів: " + pErr.message);
      setLoading(false);
      return;
    }

    setPending((pendingShops as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [router]);

  const setRole = async (id: string, role: "seller" | "rejected") => {
    setActionId(id);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      setError("Не вдалося оновити роль: " + error.message);
      setActionId(null);
      return;
    }

    setPending((prev) => prev.filter((p) => p.id !== id));
    setActionId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 text-sm">Завантаження адмінки...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Адмін-панель</h1>
            <p className="text-sm text-slate-800">
              Тут ти підтверджуєш магазини (pending → seller).
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← В кабінет
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Заявки магазинів (pending): {pending.length}
          </h2>

          {pending.length === 0 ? (
            <p className="text-sm text-slate-600">Немає заявок на підтвердження.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {p.shop_name || "Без назви"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {p.city || "—"} · {p.address || "—"}
                    </p>
                    <p className="text-xs text-slate-800">
                      Контакт: {p.contact || "—"}
                    </p>
                    <p className="text-[11px] text-slate-400">ID: {p.id}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={actionId === p.id}
                      onClick={() => setRole(p.id, "seller")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                    >
                      {actionId === p.id ? "..." : "Підтвердити"}
                    </button>
                    <button
                      disabled={actionId === p.id}
                      onClick={() => setRole(p.id, "rejected")}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
                    >
                      {actionId === p.id ? "..." : "Відхилити"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Ти залогінений як: <span className="font-semibold">{me?.role}</span>
        </p>
      </div>
    </main>
  );
}
