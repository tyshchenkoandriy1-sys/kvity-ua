// app/flowers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SellerRatingBadge } from "@/components/SellerRatingBadge";


type Flower = {
  id: string;
  name: string;
  type: string | null;
  price: number;
  stock: number;
  photo: string | null;
  city: string | null;
  shop_id: string;
  photo_updated_at: string | null;
  created_at: string | null;
  // 🟢 активність оголошення
  is_active: boolean;

  // поля для знижок
  sale_price: number | null;
  is_on_sale: boolean;
  discount_label: string | null;
};

type ShopProfile = {
  id: string;
  shop_name: string | null;
  address: string | null;
  city: string | null;
};

type ShopsMap = Record<string, ShopProfile>;

// чи це букет / композиція (для логіки мапи – по суті тут не повинно бути)
const isBouquetType = (type: string | null) => {
  const t = (type || "").toLowerCase();
  return t.includes("букет") || t.includes("компози");
};

export default function FlowersCatalogPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [shops, setShops] = useState<ShopsMap>({});
  const [ratings, setRatings] = useState<Record<string, { rating_avg: number; reviews_count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cityFilter, setCityFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const router = useRouter();

  // 🔹 основна функція завантаження квітів
  const fetchFlowers = async (opts?: { 
    
    city?: string;
    name?: string;
    type?: string;
    maxPrice?: string;
  }) => {
    console.log("FETCH_FLOWERS CALLED");
    setLoading(true);
    setError(null);

    const cityVal = opts?.city ?? cityFilter;
    const nameVal = opts?.name ?? nameFilter;
    const typeVal = opts?.type ?? typeFilter;
    const maxPriceVal = opts?.maxPrice ?? maxPrice;

    let query = supabase
      .from("flowers")
      .select(`
  id,
  name,
  type,
  price,
  stock,
  photo,
  city,
  shop_id,
  photo_updated_at,
  created_at
`)
.eq("is_active", true)


      .ilike("type", "Квіти%") // тільки поштучні квіти
      .order("created_at", { ascending: false });

    if (cityVal) {
      query = query.ilike("city", `%${cityVal}%`);
    }

    if (nameVal) {
      query = query.ilike("name", `%${nameVal}%`);
    }

    if (typeVal) {
      query = query.ilike("type", `%${typeVal}%`);
    }

    if (maxPriceVal) {
      const priceNumber = Number(maxPriceVal);
      if (!isNaN(priceNumber) && priceNumber > 0) {
        query = query.lte("price", priceNumber);
      }
    }
const isBlocked = (flower: { photo_updated_at: string | null; created_at: string | null }) => {
  const lastUpdateStr = flower.photo_updated_at || flower.created_at;
  if (!lastUpdateStr) return false;

  const lastUpdate = new Date(lastUpdateStr).getTime();
  const now = Date.now();
  const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

  return diffHours > 48;
};

    const { data: flowersData, error: flowersError } = await query;

    if (flowersError) {
      console.error("SUPABASE ERROR /flowers:", flowersError);
      setError("Не вдалося завантажити квіти");
      setLoading(false);
      return;
    }

    const typedFlowers =
      ((flowersData as any[]) || []).map((f) => ({
        ...f,
        sale_price: f.sale_price ?? null,
        is_on_sale: f.is_on_sale ?? false,
        discount_label: f.discount_label ?? null,
      })) as Flower[];

    const visibleFlowers = typedFlowers.filter((f) => !isBlocked(f));
setFlowers(visibleFlowers);


   const shopIds = Array.from(
  new Set(
    typedFlowers
      .map((f) => f.shop_id)
      .filter((id): id is string => Boolean(id))
  )
);

console.log("SHOP_IDS_LENGTH", shopIds.length);
console.log("SHOP_IDS_SAMPLE", shopIds.slice(0, 3));

// ✅ 1) підтягнути профілі магазинів
if (shopIds.length > 0) {
  const { data: shopsData, error: shopsError } = await supabase
    .from("profiles")
    .select("id, shop_name, address, city")
    .in("id", shopIds);

  if (shopsError) {
    console.warn("Cannot load shops:", shopsError);
    setShops({});
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

// ✅ 2) ⭐ підтягнути рейтинги магазинів (окремо, після shops)
if (shopIds.length > 0) {
  const { data: ratingsData, error: ratingsError } = await supabase
    .from("shop_ratings")
    .select("shop_id, rating_avg, reviews_count")
    .in("shop_id", shopIds);

  if (ratingsError) {
    console.warn("Cannot load ratings:", ratingsError);
    setRatings({});
  } else {
    const rmap: Record<string, { rating_avg: number; reviews_count: number }> =
      {};

    (ratingsData || []).forEach((r: any) => {
      rmap[r.shop_id] = {
        rating_avg: Number(r.rating_avg),
        reviews_count: Number(r.reviews_count),
      };
    });

    setRatings(rmap);
    console.log("RATINGS_MAP", rmap);
  }
} else {
  setRatings({});
}
setLoading(false);
};



  // 🔹 1) При першому рендері читаємо фільтри з URL (тільки на клієнті)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const cityFromUrl = params.get("city") || "";
    const nameFromUrl = params.get("name") || "";
    const typeFromUrl = params.get("type") || "";
    const maxFromUrl = params.get("maxPrice") || params.get("price") || "";

    if (cityFromUrl) setCityFilter(cityFromUrl);
    if (nameFromUrl) setNameFilter(nameFromUrl);
    if (typeFromUrl) setTypeFilter(typeFromUrl);
    if (maxFromUrl) setMaxPrice(maxFromUrl);

    // одразу завантажуємо список з цими фільтрами
    fetchFlowers({
      city: cityFromUrl,
      name: nameFromUrl,
      type: typeFromUrl,
      maxPrice: maxFromUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Заголовок */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Квіти поштучно 🌷
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Тут тільки одиничні квіти (без букетів, вазонів та композицій).
          </p>
        </header>

        {/* Фільтри */}
        <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              placeholder="Місто (наприклад, Київ)"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
            <input
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              placeholder="Назва (наприклад, троянда)"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <input
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              placeholder="Тип (піоновидні, кущові...)"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
            <div className="flex gap-3 md:w-56">
              <input
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="Макс. ціна"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <button
                onClick={() => fetchFlowers()}
                className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600"
              >
                Пошук
              </button>
            </div>
          </div>
        </section>

        {loading && (
          <p className="text-sm text-slate-600">Завантаження квітів...</p>
        )}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {!loading && !flowers.length && !error && (
          <p className="text-sm text-slate-600">
            Наразі немає квітів за цими фільтрами.
          </p>
        )}

        {/* Список квітів */}
        <section className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flowers.map((flower) => {
            const shop = shops[flower.shop_id];

            const hasDiscount =
              flower.is_on_sale &&
              flower.sale_price !== null &&
              !isNaN(Number(flower.sale_price)) &&
              Number(flower.sale_price) < flower.price;

            const finalPrice = hasDiscount
              ? Number(flower.sale_price)
              : flower.price;

            const discountText =
              flower.discount_label && flower.discount_label.trim().length > 0
                ? flower.discount_label
                : "Знижка";

            const handleShowOnMap = () => {
  const city = shop?.city || flower.city || "";

  // для поштучних квітів — наша внутрішня мапа
  if (!isBouquetType(flower.type)) {
    const params = new URLSearchParams();

    // фільтруємо по місту + назві
    if (city) params.set("city", city);
    if (flower.name) params.set("name", flower.name);

    // id магазину, який треба підсвітити
    params.set("highlightShopId", flower.shop_id);

    router.push(`/map?${params.toString()}`);
    return;
  }

  // fallback на випадок, якщо сюди випадково потрапить букет
  const address = shop?.address || "";
  const label = shop?.shop_name || flower.name;
  const query = encodeURIComponent(
    [city, address, label].filter(Boolean).join(", ")
  );
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${query}`,
    "_blank"
  );
};


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
                      {discountText}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    {flower.name}
                  </h2>

                  {shop?.shop_name && (
                    <p className="mt-1 text-xs text-slate-600">
                      Магазин: {shop.shop_name}
                    </p>
                  )}
                  <SellerRatingBadge
  avg={ratings[flower.shop_id]?.rating_avg}
  count={ratings[flower.shop_id]?.reviews_count}
/>


                  {(flower.city || shop?.city) && (
                    <p className="text-xs text-slate-500">
                      Місто: {flower.city || shop?.city}
                    </p>
                  )}

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

                  {/* Блок з ціною + знижкою */}
                  <div className="mt-3 flex items-baseline gap-2">
                    {hasDiscount && (
                      <p className="text-xs text-slate-600 line-through">
                        {flower.price.toLocaleString("uk-UA")} грн
                      </p>
                    )}
                    <p className="text-sm font-semibold text-slate-900">
                      {finalPrice.toLocaleString("uk-UA")} грн{" "}
                      <span className="text-xs font-normal text-slate-500">
                        {flower.stock > 0
                          ? `(в наявності: ${flower.stock})`
                          : "(нема в наявності)"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/order/${flower.id}`)}
                      disabled={flower.stock <= 0}
                      className={`w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        flower.stock > 0
                          ? "bg-pink-500 text-white hover:bg-pink-600"
                          : "cursor-not-allowed bg-slate-200 text-slate-600"
                      }`}
                    >
                      {hasDiscount ? "Замовити зі знижкою" : "Замовити"}
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
