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

    const { data, error } = await supabase
      .from("orders")
      .select("*, flowers ( name, photo, price )")
      .eq("shop_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Не вдалося завантажити замовлення");
    } else {
      setOrders((data as any) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [router]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    setError(null);

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      setError("Не вдалося оновити статус");
      setUpdatingId(null);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );

    setUpdatingId(null);
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-4">Мої замовлення</h1>
        <p className="text-slate-600 mb-6">
          Магазин: <span className="font-semibold">{profile.shop_name}</span>
        </p>

        {error && (
          <p className="text-red-500 mb-4">{error}</p>
        )}

        {!orders.length && (
          <p className="text-slate-600">
            Поки що замовлень немає.
          </p>
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
                <div className="w-28 h-28 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  Без фото
                </div>
              )}

              <div className="flex-1">
                <p className="font-semibold mb-1">
                  {order.flowers?.name} · {order.quantity} шт.
                </p>
                <p className="text-sm text-slate-500 mb-1">
                  Покупець: {order.buyer_name}
                </p>
                <p className="text-sm text-slate-500 mb-1">
                  Телефон: {order.buyer_phone}
                </p>
                {order.buyer_email && (
                  <p className="text-sm text-slate-500 mb-1">
                    Email: {order.buyer_email}
                  </p>
                )}
                {order.buyer_comment && (
                  <p className="text-sm text-slate-500 mb-1">
                    Коментар: {order.buyer_comment}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Створено: {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="w-full md:w-40 flex flex-col gap-2">
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusChange(order.id, e.target.value)
                  }
                  disabled={updatingId === order.id}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 outline-none focus:border-blue-500"
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
