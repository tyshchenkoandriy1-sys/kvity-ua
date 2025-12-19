"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  role: "pending" | "seller" | "buyer";
  shop_name: string | null;
  city: string | null;
  contact: string | null;
  address: string | null;
  avatar_url?: string | null; // те саме поле, що ти використовуєш на /profile
};

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
  doneOrders: 0,
  inProgressOrders: 0,
  cancelledOrders: 0,
  totalItemsDone: 0,
  totalRevenueDone: 0,
});

  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (shopId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("status, quantity, flowers:flower_id ( price )")
    .eq("shop_id", shopId);

  if (error || !data) {
    console.error("Stats error:", error);
    return;
  }

  let doneOrders = 0;
  let inProgressOrders = 0;
  let cancelledOrders = 0;
  let totalItemsDone = 0;
  let totalRevenueDone = 0;

  for (const o of data as any[]) {
    const qty = Number(o.quantity ?? 0);
    const price = Number(o.flowers?.price ?? 0);

    if (o.status === "done") {
      doneOrders += 1;
      totalItemsDone += qty;
      totalRevenueDone += qty * price;
    } else if (o.status === "in_progress") {
      inProgressOrders += 1;
    } else if (o.status === "cancelled") {
      cancelledOrders += 1;
    }
  }

  setStats({
    doneOrders,
    inProgressOrders,
    cancelledOrders,
    totalItemsDone,
    totalRevenueDone,
  });
};

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Поточний юзер
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError("Потрібно увійти в акаунт продавця.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // 2. Профіль магазину
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, shop_name, city, contact, address, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        console.error(profileError);
        setError("Не вдалося завантажити профіль магазину.");
        setLoading(false);
        return;
      }

      const typedProfile = profileData as Profile;
      setProfile(typedProfile);

      // 3. Кількість виконаних замовлень для цього магазину
      await loadStats(typedProfile.id);


      setLoading(false);
    };

    load();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    setLogoutLoading(false);
    router.push("/login");
  };
type PeriodKey = "today" | "7d" | "30d";

const [period, setPeriod] = useState<PeriodKey>("7d");

const [topFlowers, setTopFlowers] = useState<
  { flowerId: string; name: string; type: string | null; soldQty: number; revenue: number }[]
>([]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Завантаження кабінету...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-red-500">
          {error ?? "Профіль продавця не знайдено."}
        </p>
      </main>
    );
  }

  const isSeller = profile.role === "seller";
  const statusLabel = isSeller
    ? "підтверджений продавець 🌸"
    : "очікує підтвердження (pending)";

  const statusColor = isSeller ? "text-emerald-600" : "text-amber-600";
  const statusBg = isSeller ? "bg-emerald-50" : "bg-amber-50";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* Заголовок + кнопка виходу */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Кабінет квіткового магазину
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Керуй товарами, замовленнями та профілем свого магазину.
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            {logoutLoading ? "Вихід..." : "Вийти"}
          </button>
        </header>

        {/* Основна картка магазину */}
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:p-6">
          {/* Фото магазину */}
          <div className="flex items-center gap-4 md:w-1/3">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.shop_name ?? "Фото магазину"}
                className="h-20 w-20 rounded-2xl object-cover md:h-24 md:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-600 md:h-24 md:w-24">
                Без фото
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Магазин: {profile.shop_name || "Без назви"}
              </p>
              {profile.city && (
                <p className="text-xs text-slate-600">
                  Місто:{" "}
                  <span className="font-medium text-slate-800">
                    {profile.city}
                  </span>
                </p>
              )}
              {profile.address && (
                <p className="text-xs text-slate-600">
                  Адреса:{" "}
                  <span className="font-medium text-slate-800">
                    {profile.address}
                  </span>
                </p>
              )}
              {profile.contact && (
                <p className="text-xs text-slate-600">
                  Контакт:{" "}
                  <span className="font-medium text-slate-800">
                    {profile.contact}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Статус + статистика */}
          {/* Статус + статистика */}
<div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <div
    className={`inline-flex items-center rounded-2xl ${statusBg} px-4 py-2 text-xs font-semibold ${statusColor}`}
  >
    Статус: {statusLabel}
  </div>

  <div className="flex flex-col items-start gap-1 text-sm text-slate-700 md:items-end">
    <p className="font-semibold">
      Виконаних замовлень:{" "}
      <span className="text-pink-600">{stats.doneOrders}</span>
    </p>

    <p className="text-xs text-slate-500">
      В роботі:{" "}
      <span className="font-semibold text-slate-900">{stats.inProgressOrders}</span>{" "}
      · Скасовано:{" "}
      <span className="font-semibold text-red-600">{stats.cancelledOrders}</span>
    </p>

    <p className="text-xs text-slate-500">
      Продано (done):{" "}
      <span className="font-semibold text-slate-900">{stats.totalItemsDone} шт</span>
    </p>

    <p className="text-xs text-slate-500">
      Оборот (done):{" "}
      <span className="font-semibold text-emerald-600">
        {stats.totalRevenueDone.toLocaleString("uk-UA")} грн
      </span>
    </p>

    <p className="text-[11px] text-slate-600">
      Рахується за замовленнями зі статусом “done”.
    </p>
  </div>
</div>


   

        </section>

        {/* Навігаційні блоки */}
        <section className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
          >
            <span className="font-semibold text-slate-900">
              Профіль продавця
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Фото, назва магазину, контакти, адреса.
            </span>
          </button>

          <button
            onClick={() => router.push("/myflowers")}
            className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
          >
            <span className="font-semibold text-slate-900">Мої квіти</span>
            <span className="mt-1 text-xs text-slate-500">
              Перегляд, редагування та видалення оголошень.
            </span>
          </button>

          <button
            onClick={() => router.push("/addflower")}
            className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
          >
            <span className="font-semibold text-slate-900">Додати квітку</span>
            <span className="mt-1 text-xs text-slate-500">
              Створення нового оголошення з фото та ціною.
            </span>
          </button>

          <button
            onClick={() => router.push("/myorders")}
            className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
          >
            <span className="font-semibold text-slate-900">Мої замовлення</span>
            <span className="mt-1 text-xs text-slate-500">
              Перегляд замовлень, контакти покупців, зміна статусу.
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}
