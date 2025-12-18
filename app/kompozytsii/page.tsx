"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Flower = {
  id: string;
  name: string;
  type: string | null;
  price: number;
  stock: number;
  photo: string | null;
  city: string | null;
  shop_id: string;
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

const isBouquetOrComposition = (type: string | null) => {
  const t = (type || "").toLowerCase();
  return t.includes("букет") || t.includes("компози");
};

const isCompositionOnly = (type: string | null) => {
  const t = (type || "").toLowerCase();
  return t.includes("компози");
};

export default function KompozytsiiCatalogPage() {
  const router = useRouter();

  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [shops, setShops] = useState<ShopsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cityFilter, setCityFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchFlowers = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("flowers")
      .select("id, name, type, price, stock, photo, city, shop_id")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (cityFilter) {
      query = query.ilike("city", `%${cityFilter}%`);
    }
    if (nameFilter) {
      query = query.ilike("name", `%${nameFilter}%`);
    }
    if (typeFilter) {
      query = query.ilike("type", `%${typeFilter}%`);
    }
    if (maxPrice) {
      const priceNumber = Number(maxPrice);
      if (!isNaN(priceNumber) && priceNumber > 0) {
        query = query.lte("price", priceNumber);
      }
    }

    const { data: flowersData, error: flowersError } = await query;

    if (flowersError) {
      console.error(flowersError);
      setError("Не вдалося завантажити композиції");
      setLoading(false);
      return;
    }

    const typedFlowers = (flowersData as Flower[]) || [];
    const compositionsOnly = typedFlowers.filter((f) =>
      isCompositionOnly(f.type)
    );
    setFlowers(compositionsOnly);

    const shopIds = Array.from(
      new Set(
        compositionsOnly
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

    setLoading(false);
  };

  useEffect(() => {
    fetchFlowers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Каталог композицій 🎀
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Квіткові композиції та бокси від локальних магазинів. Фільтруй за
            містом, назвою, типом та ціною.
          </p>
        </header>

        {/* Фільтри */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
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
              placeholder="Назва (наприклад, «Ніжність»)"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              placeholder="Тип (коробка, корзина...)"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
            <div className="flex gap-3 md:w-64">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="Макс. ціна"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <button
                onClick={fetchFlowers}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Пошук
              </button>
            </div>
          </div>
        </section>

        {loading && (
          <p className="text-sm text-slate-600">
            Завантаження композицій...
          </p>
        )}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {!loading && !flowers.length && !error && (
          <p className="text-sm text-slate-600">
            Наразі немає композицій за цими фільтрами.
          </p>
        )}

        {/* Список композицій */}
        <section className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flowers.map((flower) => {
            const shop = shops[flower.shop_id];
            const isOutOfStock = flower.stock <= 0;

            return (
              <article
                key={flower.id}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {flower.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flower.photo}
                    alt={flower.name}
                    className="mb-3 h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-40 w-full items-center justify-center rounded-2xl bg-slate-50 text-xs text-slate-400">
                    Без фото
                  </div>
                )}

                <h2 className="text-base font-semibold text-slate-900">
                  {flower.name}
                </h2>

                {shop?.shop_name && (
                  <p className="mt-1 text-xs text-slate-600">
                    Магазин: {shop.shop_name}
                  </p>
                )}

                {(flower.city || shop?.city) && (
                  <p className="mt-1 text-xs text-slate-500">
                    Місто: {flower.city || shop?.city}
                  </p>
                )}

                {shop?.address && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Адреса: {shop.address}
                  </p>
                )}

                {flower.type && (
                  <p className="mt-2 text-xs text-slate-500">
                    Тип: {flower.type}
                  </p>
                )}

                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {flower.price.toLocaleString("uk-UA")} грн{" "}
                  <span className="text-xs font-normal text-slate-500">
                    {isOutOfStock
                      ? "(нема в наявності)"
                      : `(в наявності: ${flower.stock})`}
                  </span>
                </p>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/order/${flower.id}`)}
                    disabled={isOutOfStock}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition ${
                      isOutOfStock
                        ? "cursor-not-allowed bg-slate-200 text-slate-400"
                        : "bg-pink-500 text-white hover:bg-pink-600"
                    }`}
                  >
                    Замовити
                  </button>

                  <button
                    onClick={() => {
                      const city = shop?.city || flower.city || "";
                      const address = shop?.address || "";
                      const label = shop?.shop_name || flower.name;

                      if (isBouquetOrComposition(flower.type)) {
                        const query = encodeURIComponent(
                          [city, address, label]
                            .filter(Boolean)
                            .join(", ")
                        );
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${query}`,
                          "_blank"
                        );
                        return;
                      }

                      const params = new URLSearchParams();
                      if (city) params.set("city", city);
                      if (flower.type) params.set("type", flower.type);
                      router.push(`/map?${params.toString()}`);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Показати на мапі
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
