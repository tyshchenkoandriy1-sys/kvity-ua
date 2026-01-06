// app/sales/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SellerRatingBadge } from "@/components/SellerRatingBadge";
import { gaEvent } from "@/lib/ga";



type Flower = {
  id: string;
  name: string;
  type: string | null;
  category: string | null;
  price: number;
  sale_price: number | null;
  discount_label: string | null;
  is_on_sale: boolean;
  stock: number;
  photo: string | null;
  city: string | null;
  shop_id: string;
  photo_updated_at: string | null;
  created_at: string | null;
  // 🟢 активність оголошення
  is_active: boolean;
};

type ShopProfile = {
  id: string;
  shop_name: string | null;
  address: string | null;
  city: string | null;
};

type ShopsMap = Record<string, ShopProfile>;

const isBouquetType = (type: string | null) => {
  const t = (type || "").toLowerCase();
  return t.includes("букет") || t.includes("компози");
};

// заблоковане оголошення (фото не міняли > 48 год)
const isBlocked = (flower: Flower) => {
  const lastUpdateStr = flower.photo_updated_at || flower.created_at;
  if (!lastUpdateStr) return false;

  const lastUpdate = new Date(lastUpdateStr).getTime();
  const now = Date.now();
  const diffHours = (now - lastUpdate) / (1000 * 60 * 60);
  return diffHours > 48;
};

export default function SalesPage() {
  const router = useRouter();

  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [shops, setShops] = useState<ShopsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, { rating_avg: number; reviews_count: number }>>({});


  // прості фільтри
  const [cityFilter, setCityFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  const fetchDiscountFlowers = async () => {
    setLoading(true);
    setError(null);

    // 1) Тягнемо тільки ті квіти, де включена знижка
    let query = supabase
      .from("flowers")
      .select(
        `
        id,
        name,
        type,
        category,
        price,
        sale_price,
        discount_label,
        is_on_sale,
        stock,
        photo,
        city,
        shop_id,
        photo_updated_at,
        created_at
      `
      )
      .eq("is_active", true)
      .eq("is_on_sale", true)
      .not("sale_price", "is", null)
      .order("created_at", { ascending: false });

    if (cityFilter) {
      query = query.ilike("city", `%${cityFilter}%`);
    }

    if (nameFilter) {
      query = query.ilike("name", `%${nameFilter}%`);
    }

    const { data: flowersData, error: flowersError } = await query;

    if (flowersError) {
      console.error(flowersError);
      setError("Не вдалося завантажити акційні квіти");
      setLoading(false);
      return;
    }

    const typedFlowers = (flowersData as Flower[]) || [];

    // гарантуємо дефолтні значення
    const normalized = typedFlowers.map((f) => ({
      ...f,
      sale_price: f.sale_price ?? null,
      is_on_sale: f.is_on_sale ?? false,
      discount_label: f.discount_label ?? null,
    }));

    // відфільтровуємо заблоковані (старе фото) + некоректні знижки
    const visibleFlowers = normalized.filter((f) => {
      if (isBlocked(f)) return false;
      if (!f.is_on_sale) return false;
      if (f.sale_price == null) return false;
      if (f.sale_price <= 0) return false;
      if (f.sale_price >= f.price) return false;
      return true;
    });

    setFlowers(visibleFlowers);

    // 2) Підтягуємо профілі магазинів
    const shopIds = Array.from(
      new Set(
        visibleFlowers
          .map((f) => f.shop_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (shopIds.length > 0) {
      const {
        data: shopsData,
        error: shopsError,
      } = await supabase
        .from("profiles")
        .select("id, shop_name, address, city")
        .in("id", shopIds);

      if (shopsError) {
        console.warn("Cannot load shops:", shopsError);
      } else {
        const map: ShopsMap = {};
        (shopsData as ShopProfile[]).forEach((shop) => {
          map[shop.id] = shop;
        });
        setShops(map);
      }
    } else {
      setShops({});
    }
    // ⭐ підтягнути рейтинги магазинів
const { data: ratingsData, error: ratingsError } = await supabase
  .from("shop_ratings")
  .select("shop_id, rating_avg, reviews_count")
  .in("shop_id", shopIds);

if (ratingsError) {
  console.warn("Cannot load ratings:", ratingsError);
  setRatings({});
} else {
  const rmap: Record<string, { rating_avg: number; reviews_count: number }> = {};
  (ratingsData || []).forEach((r: any) => {
    rmap[r.shop_id] = {
      rating_avg: Number(r.rating_avg),
      reviews_count: Number(r.reviews_count),
    };
  });
  setRatings(rmap);
}


    setLoading(false);
  };

  useEffect(() => {
    fetchDiscountFlowers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Заголовок */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Знижки та акції 🌟
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Тут зібрані букети, квіти, вазони та композиції зі знижками.
          </p>
        </header>

        {/* Фільтри */}
        <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              placeholder="Місто (наприклад, Київ)"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              placeholder="Назва (наприклад, букет піонів)"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <button
              onClick={fetchDiscountFlowers}
              className="md:w-40 rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600"
            >
              Оновити список
            </button>
          </div>
        </section>

        {loading && (
          <p className="text-sm text-slate-600">
            Завантаження акційних товарів...
          </p>
        )}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {!loading && !flowers.length && !error && (
          <p className="text-sm text-slate-600">
            Зараз немає активних знижок. Заглянь пізніше 💐
          </p>
        )}

        {/* Список акційних квітів */}
        <section className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flowers.map((flower) => {
            const shop = shops[flower.shop_id];

            const handleShowOnMap = () => {
              const city = shop?.city || flower.city || "";
              const address = shop?.address || "";
              const label = shop?.shop_name || flower.name;

              if (isBouquetType(flower.type)) {
                const query = encodeURIComponent(
                  [city, address, label].filter(Boolean).join(", ")
                );

                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${query}`,
                  "_blank"
                );
                return;
              }

              const params = new URLSearchParams();
              if (city) params.set("city", city);
              if (flower.type) params.set("type", flower.type ?? "");
              if (flower.name) params.set("name", flower.name);

              router.push(`/map?${params.toString()}`);
            };

            const hasDiscount =
              flower.is_on_sale &&
              flower.sale_price !== null &&
              !isNaN(Number(flower.sale_price)) &&
              Number(flower.sale_price) < flower.price;

            const finalPrice = hasDiscount
              ? Number(flower.sale_price)
              : flower.price;

            const label =
              flower.discount_label && flower.discount_label.trim().length > 0
                ? flower.discount_label
                : "Знижка";

            return (
              <article
                key={flower.id}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative">
                  {flower.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={flower.photo}
                      alt={flower.name}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-50 text-sm text-slate-600">
                      Без фото
                    </div>
                  )}

                  {hasDiscount && (
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                      {label}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    {flower.name}
                  </h2>

                  {flower.category && (
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-600">
                      {flower.category}
                    </p>
                  )}

                  {shop?.shop_name && (
                    <p className="mt-1 text-xs text-slate-600">
                      Магазин: {shop.shop_name}
                    </p>
                  )}
                  

                  {(flower.city || shop?.city) && (
                    <p className="text-xs text-slate-500">
                      Місто: {flower.city || shop?.city}
                    </p>
                  )}
                  <SellerRatingBadge
  avg={ratings[flower.shop_id]?.rating_avg}
  count={ratings[flower.shop_id]?.reviews_count}
/>
                  

                  {shop?.address && (
                    <p className="text-[11px] text-slate-500">
                      Адреса: {shop.address}
                    </p>
                  )}

                  {flower.type && (
                    <p className="mt-1 text-xs text-slate-500">
                      Тип: {flower.type}
                    </p>
                  )}
                  


                  {/* Ціни зі знижкою */}
                  <div className="mt-3 flex items-baseline gap-2">
                    {hasDiscount && (
                      <p className="text-sm text-slate-600 line-through">
                        {flower.price.toLocaleString("uk-UA")} грн
                      </p>
                    )}
                    <p className="text-lg font-semibold text-slate-900">
                      {finalPrice.toLocaleString("uk-UA")} грн
                    </p>
                    <span className="text-xs text-slate-500">
                      {flower.stock > 0
                        ? `(в наявності: ${flower.stock})`
                        : "(нема в наявності)"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => {
  gaEvent("order_start", {
    flower_id: flower.id,
    flower_name: flower.name,
    city: flower.city,
    price: flower.price,
    is_sale: hasDiscount,
    stock: flower.stock,
  });

  router.push(`/order/${flower.id}`);
}}
                      disabled={flower.stock <= 0}
                      className={`w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        flower.stock > 0
                          ? "bg-pink-500 text-white hover:bg-pink-600"
                          : "cursor-not-allowed bg-slate-200 text-slate-600"
                      }`}
                    >
                      Замовити за акцією
                    </button>

                    <button
                      onClick={handleShowOnMap}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Показати на мапі
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
