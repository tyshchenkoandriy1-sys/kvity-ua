"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  id: string;
  role: string;
  shop_name: string | null;
  city: string | null;
  address: string | null;
  contact: string | null;
  created_at: string | null;
};

export default function AdminSellersPage() {
  const router = useRouter();

  const [meRole, setMeRole] = useState<string | null>(null);
  const [pending, setPending] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    // 1) сесія
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const userId = sessionData?.session?.user?.id;
    if (sessionError || !userId) {
      router.push("/login");
      return;
    }

    // 2) перевірка ролі (адмін чи ні)
    const { data: myProfile, error: myErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (myErr || !myProfile) {
      setError("Не вдалося перевірити роль.");
      setLoading(false);
      return;
    }

    setMeRole(myProfile.role);

    if (myProfile.role !== "admin") {
      setError("Доступ тільки для адміністратора.");
      setLoading(false);
      return;
    }

    // 3) тягнемо pending продавців
    const { data: pendingData, error: pendingErr } = await supabase
      .from("profiles")
      .select("id, role, shop_name, city, address, contact, created_at")
      .eq("role", "pending")
      .order("created_at", { ascending: true });

    if (pendingErr) {
      setError("Не вдалося завантажити список продавців.");
      setPending([]);
    } else {
      setPending((pendingData as ProfileRow[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id: string) => {
    setActionLoadingId(id);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role: "seller" })
      .eq("id", id);

    if (error) {
      setError("Не вдалося підтвердити продавця (RLS?).");
      setActionLoadingId(null);
      return;
    }

    setPending((prev) => prev.filter((p) => p.id !== id));
    setActionLoadingId(null);
  };

  const reject = async (id: string) => {
    setActionLoadingId(id);
    setError(null);

    // варіант без видалення: просто role = rejected
    const { error } = await supabase
      .from("profiles")
      .update({ role: "rejected" })
      .eq("id", id);

    if (error) {
      setError("Не вдалося відхилити продавця (RLS?).");
      setActionLoadingId(null);
      return;
    }

    setPending((prev) => prev.filter((p) => p.id !== id));
    setActionLoadingId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Завантаження...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            Адмінка · Продавці на підтвердження
          </h1>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            ← Назад
          </button>
        </div>

        {meRole !== "admin" && (
          <p className="mt-4 text-sm text-red-600">
            {error || "Доступ заборонено."}
          </p>
        )}

        {meRole === "admin" && (
          <>
            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}

            {!pending.length ? (
              <p className="mt-6 text-sm text-slate-600">
                Немає магазинів зі статусом <b>pending</b>.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {p.shop_name || "Без назви"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {p.city || "—"} · {p.address || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Контакт: {p.contact || "—"}
                    </p>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => approve(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                      >
                        {actionLoadingId === p.id ? "..." : "Підтвердити"}
                      </button>
                      <button
                        onClick={() => reject(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:bg-red-300"
                      >
                        {actionLoadingId === p.id ? "..." : "Відхилити"}
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-600 break-all">
                      id: {p.id}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
