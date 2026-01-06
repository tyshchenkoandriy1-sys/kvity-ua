"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { gaEvent } from "@/lib/ga";


type Flower = {
  id: string;
  name: string;
  type: string | null;
  price: number;
  stock: number;
  photo: string | null;
  city: string | null;
  shop_id: string;
  sold_count: number | null;
};

export default function OrderPage() {
  const router = useRouter();
  const params = useParams();
  const flowerId = params?.id as string;

  const [flower, setFlower] = useState<Flower | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    const load = async () => {
      if (!flowerId) return;

      const { data } = await supabase
  .from("flowers")
  .select("id, shop_id, name, price, city, photo, stock")
  .eq("id", params.id)
  .single();


      if (error || !data) {
        setError("Квітку не знайдено");
        setLoading(false);
        return;
      }

      setFlower(data as Flower);
      setLoading(false);
    };

    load();
  }, [flowerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flower) return;
    gaEvent("order_submit", {
    flower_id: flower.id,
    flower_name: flower.name,
    city: flower.city ?? "(unknown)",
    price: flower.price,
    quantity: Number(quantity),
  });
    

    setError(null);
    setSuccess(null);

    if (!buyerName || !buyerPhone) {
      setError("Імʼя та телефон обовʼязкові");
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Кількість має бути більше 0");
      return;
    }

    if (qty > flower.stock) {
      setError("Такої кількості немає в наявності");
      return;
    }

    setSubmitting(true);

    // спробуємо дістати email, якщо юзер залогінений
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const buyerEmail = session?.user?.email ?? null;

    // 1) створюємо замовлення
    const { error: orderError } = await supabase.from("orders").insert({
  flower_id: flower.id,
  shop_id: flower.shop_id,
  buyer_name: buyerName,
  buyer_phone: buyerPhone,
  buyer_email: buyerEmail,
  buyer_comment: comment || null,
  quantity: qty,
  status: "new",
});


console.log("DEBUG shop_id:", flower?.shop_id);
console.log("ORDER ERROR:", orderError);

    if (orderError) {
      console.error(orderError);
      setError("Не вдалося оформити замовлення");
      setSubmitting(false);
      return;
    }

    // ✅ ВАЖЛИВО:
    // Тут БІЛЬШЕ НІЧОГО НЕ ОНОВЛЮЄМО у flowers (stock/sold_count).
    // Stock змінюється ТІЛЬКИ коли продавець змінює статус у "Мої замовлення".

    setSuccess("Замовлення успішно оформлено! 🌸 Ми скоро з вами звʼяжемось.");
    setSubmitting(false);
    setBuyerName("");
    setBuyerPhone("");
    setComment("");
    setQuantity("1");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Завантаження...</p>
      </div>
    );
  }

  if (!flower) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-red-500">
          {error ?? "Квітку не знайдено"}
        </p>
      </div>
    );
  }

  const isOutOfStock = flower.stock <= 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Оформлення замовлення 🌸
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Заповни контактні дані — флорист магазину звʼяжеться з тобою,
            щоб підтвердити замовлення та домовитись про доставку.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Ліва колонка — інформація про квітку */}
          <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            {flower.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={flower.photo}
                alt={flower.name}
                className="mb-4 h-64 w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="mb-4 flex h-64 w-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-600">
                Без фото
              </div>
            )}

            <h2 className="text-xl font-semibold text-slate-900">
              {flower.name}
            </h2>

            {flower.type && (
              <p className="mt-2 text-sm text-slate-500">
                Тип:{" "}
                <span className="font-medium text-slate-700">
                  {flower.type}
                </span>
              </p>
            )}

            {flower.city && (
              <p className="mt-1 text-sm text-slate-500">
                Місто:{" "}
                <span className="font-medium text-slate-700">
                  {flower.city}
                </span>
              </p>
            )}

            <p className="mt-4 text-lg font-semibold text-slate-900">
              {flower.price.toLocaleString("uk-UA")} грн{" "}
              <span className="text-sm font-normal text-slate-500">
                {isOutOfStock
                  ? "(нема в наявності)"
                  : `(в наявності: ${flower.stock})`}
              </span>
            </p>

            {flower.sold_count !== null && (
              <p className="mt-1 text-xs text-slate-600">
                Вже замовили: {flower.sold_count} шт
              </p>
            )}
          </section>

          {/* Права колонка — форма замовлення */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
              Заповни дані для замовлення
            </h2>

            {error && (
              <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Імʼя *
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
                  text-slate-800 placeholder-slate-500
                  outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Як до тебе звертатись?"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Телефон *
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
                  text-slate-800 placeholder-slate-500
                  outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+380..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Кількість
                </label>
                <input
                  type="number"
                  min={1}
                  max={flower.stock}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
                  text-slate-800 placeholder-slate-500
                  outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-600">
                  Максимум: {flower.stock} шт
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Коментар
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Час доставки, побажання, текст записки тощо"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isOutOfStock}
                className={`mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  isOutOfStock
                    ? "cursor-not-allowed bg-slate-200 text-slate-600"
                    : "bg-pink-500 text-white hover:bg-pink-600"
                }`}
              >
                {submitting ? "Відправляємо замовлення..." : "Підтвердити замовлення"}
              </button>
            </form>

            <button
              onClick={() => router.push("/flowers")}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              ← Повернутись до каталогу
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
