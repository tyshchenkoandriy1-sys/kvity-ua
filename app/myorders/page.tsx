"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Order = {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  buyer_comment: string | null;
  quantity: number;
  status: string;
  created_at: string;
  flower_id: string;
  flowers?: {
    name: string;
    photo: string | null;
    price: number;
  } | null;
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 1) Додаємо state tab
  const [tab, setTab] = useState<"active" | "done">("active");

  const load = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      router.push("/login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profileData) {
      setError("Не вдалося завантажити профіль");
      setLoading(false);
      return;
    }

    if (profileData.role !== "seller") {
      setError("Сторінка доступна лише для продавців");
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // 2) Міняємо запит orders залежно від tab
    let query = supabase
      .from("orders")
      .select("*, flowers ( name, photo, price )")
      .eq("shop_id", session.user.id)
      .order("created_at", { ascending: false });

    if (tab === "active") {
      query = query.in("status", ["new", "in_progress"]);
    } else {
      query = query.in("status", ["done", "cancelled"]);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setError("Не вдалося завантажити замовлення");
    } else {
      setOrders((data as any) || []);
    }

    setLoading(false);
  };

  // 3) Перезавантажувати список при зміні tab
  useEffect(() => {
    load();
  }, [router, tab]);

  const handleStatusChange = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    setError(null);

    try {
      const { data: orderRow, error: orderErr } = await supabase
        .from("orders")
        .select("id, status, quantity, flower_id")
        .eq("id", id)
        .single();

      if (orderErr || !orderRow) {
        console.error(orderErr);
        setError("Не вдалося знайти замовлення");
        setUpdatingId(null);
        return;
      }

      const prevStatus = orderRow.status;
      const qty = Number(orderRow.quantity ?? 0);
      const flowerId = orderRow.flower_id as string;

      if (prevStatus === nextStatus) {
        setUpdatingId(null);
        return;
      }

      const { error: updOrderErr } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", id);

      if (updOrderErr) {
        console.error(updOrderErr);
        setError("Не вдалося оновити статус");
        setUpdatingId(null);
        return;
      }

      const becomesReservedOrDone =
        (nextStatus === "in_progress" || nextStatus === "done") &&
        !(prevStatus === "in_progress" || prevStatus === "done");

      const becomesCancelledFromReservedOrDone =
        nextStatus === "cancelled" &&
        (prevStatus === "in_progress" || prevStatus === "done");

      if (becomesReservedOrDone || becomesCancelledFromReservedOrDone) {
        const { data: flowerRow, error: flowerErr } = await supabase
          .from("flowers")
          .select("id, stock, sold_count, is_active")
          .eq("id", flowerId)
          .single();

        if (flowerErr || !flowerRow) {
          console.error(flowerErr);
          setError("Статус оновлено, але не вдалося оновити склад (stock).");
        } else {
          const currentStock = Number(flowerRow.stock ?? 0);
          const currentSold = Number(flowerRow.sold_count ?? 0);

          let newStock = currentStock;
          let newSold = currentSold;

          if (becomesReservedOrDone) {
            newStock = Math.max(0, currentStock - qty);
            newSold = currentSold + qty;
          }

          if (becomesCancelledFromReservedOrDone) {
            newStock = currentStock + qty;
            newSold = Math.max(0, currentSold - qty);
          }

          const newIsActive = newStock > 0;

          const { error: updFlowerErr } = await supabase
            .from("flowers")
            .update({
              stock: newStock,
              sold_count: newSold,
              is_active: newIsActive,
            })
            .eq("id", flowerId);

          if (updFlowerErr) {
            console.error(updFlowerErr);
            setError("Статус оновлено, але не вдалося оновити квітку (stock).");
          }
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p>Завантаження...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-500">{error ?? "Профіль не знайдено"}</p>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-slate-50 text-slate-900">
  <div className="max-w-5xl mx-auto py-10 px-4">
    <h1 className="text-3xl font-bold mb-4 text-slate-900">
      Мої замовлення
    </h1>


        {/* 4) Додаємо кнопки в UI */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab("active")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
              tab === "active"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            Активні
          </button>

          <button
            onClick={() => setTab("done")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
              tab === "done"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            Виконані
          </button>
        </div>

        <p className="text-slate-600 mb-6">
          Магазин: <span className="font-semibold">{profile.shop_name}</span>
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!orders.length && (
          <p className="text-slate-600">Поки що замовлень немає.</p>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow p-4 flex flex-col md:flex-row gap-4"
            >
              {order.flowers?.photo ? (
                <img
                  src={order.flowers.photo}
                  alt={order.flowers.name}
                  className="w-28 h-28 object-cover rounded-xl"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 text-xs">
                  Без фото
                </div>
              )}

              <div className="flex-1">
                <p className="font-semibold mb-1">
                  {order.flowers?.name} · {order.quantity} шт.
                </p>
                <p className="text-sm text-slate-700 mb-1">
                  Покупець: {order.buyer_name}
                </p>
                <p className="text-sm text-slate-700 mb-1">
                  Телефон: {order.buyer_phone}
                </p>
                {order.buyer_email && (
                  <p className="text-sm text-slate-700 mb-1">
                    Email: {order.buyer_email}
                  </p>
                )}
                {order.buyer_comment && (
                  <p className="text-sm text-slate-700 mb-1">
                    Коментар: {order.buyer_comment}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  Створено: {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="w-full md:w-40 flex flex-col gap-2">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingId === order.id}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="new">Новий</option>
                  <option value="in_progress">В обробці</option>
                  <option value="done">Виконано</option>
                  <option value="cancelled">Скасовано</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
