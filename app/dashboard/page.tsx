"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Role = "pending" | "seller" | "buyer" | "admin" | "rejected";

type Profile = {
  id: string;
  role: Role;
  shop_name: string | null;
  city: string | null;
  contact: string | null;
  address: string | null;
  avatar_url?: string | null;
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

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError("Потрібно увійти в акаунт.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, shop_name, city, contact, address, avatar_url")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        console.error(profileError);
        setError("Не вдалося завантажити профіль.");
        setLoading(false);
        return;
      }

      const typedProfile = profileData as Profile;
      setProfile(typedProfile);

      if (typedProfile.role === "seller") {
        await loadStats(typedProfile.id);
      } else {
        setStats({
          doneOrders: 0,
          inProgressOrders: 0,
          cancelledOrders: 0,
          totalItemsDone: 0,
          totalRevenueDone: 0,
        });
      }

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-700">
          Завантаження кабінету...
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-red-700">
          {error ?? "Профіль не знайдено."}
        </p>
      </main>
    );
  }

  const isSeller = profile.role === "seller";
  const isAdmin = profile.role === "admin";
  const isPending = profile.role === "pending";

  const statusLabel = isAdmin
    ? "адміністратор 🔧"
    : isSeller
    ? "підтверджений продавець 🌸"
    : isPending
    ? "очікує підтвердження (pending)"
    : "користувач";

  const statusColor = isAdmin
    ? "text-slate-900"
    : isSeller
    ? "text-emerald-700"
    : "text-amber-700";

  const statusBg = isAdmin
    ? "bg-slate-100"
    : isSeller
    ? "bg-emerald-50"
    : "bg-amber-50";

  const sellerOnlyDisabled = !isSeller;
  const sellerOnlyHint = isPending
    ? "Доступно після підтвердження магазину."
    : "Доступно тільки продавцю.";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        {/* Заголовок + кнопки */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Кабінет квіткового магазину
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              Керуй товарами, замовленнями та профілем свого магазину.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ КНОПКА АДМІНКИ — тільки для admin */}
            {isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Адмінка
              </button>
            )}

            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-70"
            >
              {logoutLoading ? "Вихід..." : "Вийти"}
            </button>
          </div>
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
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-sm font-medium text-slate-700 md:h-24 md:w-24">
                Без фото
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Магазин: {profile.shop_name || "Без назви"}
              </p>

              {profile.city && (
                <p className="text-xs text-slate-700">
                  Місто:{" "}
                  <span className="font-semibold text-slate-900">
                    {profile.city}
                  </span>
                </p>
              )}

              {profile.address && (
                <p className="text-xs text-slate-700">
                  Адреса:{" "}
                  <span className="font-semibold text-slate-900">
                    {profile.address}
                  </span>
                </p>
              )}

              {profile.contact && (
                <p className="text-xs text-slate-700">
                  Контакт:{" "}
                  <span className="font-semibold text-slate-900">
                    {profile.contact}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Статус + статистика */}
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div
              className={`inline-flex items-center rounded-2xl ${statusBg} px-4 py-2 text-xs font-semibold ${statusColor}`}
            >
              Статус: {statusLabel}
            </div>

            <div className="flex flex-col items-start gap-1 text-sm text-slate-800 md:items-end">
              <p className="font-semibold text-slate-900">
                Виконаних замовлень:{" "}
                <span className="text-pink-700">{stats.doneOrders}</span>
              </p>

              <p className="text-xs text-slate-700">
                В роботі:{" "}
                <span className="font-semibold text-slate-900">
                  {stats.inProgressOrders}
                </span>{" "}
                · Скасовано:{" "}
                <span className="font-semibold text-red-700">
                  {stats.cancelledOrders}
                </span>
              </p>

              <p className="text-xs text-slate-700">
                Продано (done):{" "}
                <span className="font-semibold text-slate-900">
                  {stats.totalItemsDone} шт
                </span>
              </p>

              <p className="text-xs text-slate-700">
                Оборот (done):{" "}
                <span className="font-semibold text-emerald-700">
                  {stats.totalRevenueDone.toLocaleString("uk-UA")} грн
                </span>
              </p>

              <p className="text-[11px] text-slate-700">
                Рахується за замовленнями зі статусом “done”.
              </p>
            </div>
          </div>
        </section>

        {/* Навігаційні блоки */}
        <section className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
          >
            <span className="font-semibold text-slate-900">
              Профіль продавця
            </span>
            <span className="mt-1 text-xs text-slate-700">
              Фото, назва магазину, контакти, адреса.
            </span>
          </button>

          <button
            onClick={() => router.push("/myflowers")}
            disabled={sellerOnlyDisabled}
            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition
              ${
                sellerOnlyDisabled
                  ? "border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed opacity-70"
                  : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
              }`}
          >
            <span className="font-semibold text-slate-900">Мої квіти</span>
            <span className="mt-1 text-xs text-slate-700">
              {sellerOnlyDisabled
                ? sellerOnlyHint
                : "Перегляд, редагування та видалення оголошень."}
            </span>
          </button>

          <button
            onClick={() => router.push("/addflower")}
            disabled={sellerOnlyDisabled}
            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition
              ${
                sellerOnlyDisabled
                  ? "border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed opacity-70"
                  : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
              }`}
          >
            <span className="font-semibold text-slate-900">Додати квітку</span>
            <span className="mt-1 text-xs text-slate-700">
              {sellerOnlyDisabled
                ? sellerOnlyHint
                : "Створення нового оголошення з фото та ціною."}
            </span>
          </button>

          <button
            onClick={() => router.push("/myorders")}
            disabled={sellerOnlyDisabled}
            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition
              ${
                sellerOnlyDisabled
                  ? "border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed opacity-70"
                  : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
              }`}
          >
            <span className="font-semibold text-slate-900">Мої замовлення</span>
            <span className="mt-1 text-xs text-slate-700">
              {sellerOnlyDisabled
                ? sellerOnlyHint
                : "Перегляд замовлень, контакти покупців, зміна статусу."}
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}
