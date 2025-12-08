"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
};

type ShopProfile = {
  id: string;
  shop_name: string | null;
  address: string | null;
  city: string | null;
};

type ShopsMap = Record<string, ShopProfile>;

const CATEGORY_TITLE = "Вазони";

export default function VazonyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [shops, setShops] = useState<ShopsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // фільтри (місто з query-рядка, решта — з інпутів)
  const [cityFilter, setCityFilter] = useState(
    () => searchParams.get("city") ?? ""
  );
  const [nameFilter, setNameFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchFlowers = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("flowers")
      .select(
        "id, name, type, price, stock, photo, city, shop_id"
      )
      .order("created_at", { ascending: false });

    // Місто з фільтра
    if (cityFilter) {
      query = query.ilike("city", `%${cityFilter}%`);
    }

    // Пошук за назвою
    if (nameFilter) {
      query = query.ilike("name", `%${nameFilter}%`);
    }

    // Тільки вазони — по type (тут можна підлаштувати під свої значення)
    query = query.ilike("type", "%вазон%");

    // Максимальна ціна
    if (maxPrice) {
      const priceNumber = Number(maxPrice);
      if (!isNaN(priceNumber) && priceNumber > 0) {
        query = query.lte("price", priceNumber);
      }
    }

    const { data: flowersData, error: flowersError } = await query;

    if (flowersError) {
      console.error(flowersError);
      setError("Не вдалося завантажити вазони");
      setLoading(false);
      return;
    }

    const typedFlowers = (flowersData as Flower[]) || [];
    setFlowers(typedFlowers);

    // підтягнути профілі магазинів
    const shopIds = Array.from(
      new Set(
        typedFlowers
          .map((f) => f.shop_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (shopIds.length > 0) {
      const { data: shopsData, error: shopsError } = await supabase
        .from("profiles")
        .select("id, shop_name, address, city")
        .in("id", shopIds);

      if (!shopsError && shopsData) {
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
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {CATEGORY_TITLE} 💐
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Знайди вазони у локальних квіткових магазинах. Фільтруй за містом,
          назвою та ціною.
        </p>

        {/* ФІЛЬТРИ */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Місто (наприклад, Київ)"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Назва (наприклад, фікус)"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <input
            className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Макс. ціна"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <button
            onClick={fetchFlowers}
            className="w-full rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 md:w-auto"
          >
            Пошук
          </button>
        </div>

        {loading && <p className="text-slate-600">Завантаження...</p>}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {!loading && !flowers.length && !error && (
          <p className="text-slate-600">
            Наразі немає вазонів за цими фільтрами.
          </p>
        )}

        {/* СПИСОК ВАЗОНІВ */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flowers.map((flower) => {
            const shop = shops[flower.shop_id];

            return (
              <article
                key={flower.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {flower.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flower.photo}
                    alt={flower.name}
                    className="mb-3 h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                    Без фото
                  </div>
                )}

                <h2 className="text-sm font-semibold text-slate-900">
                  {flower.name}
                </h2>

                {shop?.shop_name && (
                  <p className="mt-1 text-xs text-slate-500">
                    Магазин: {shop.shop_name}
                  </p>
                )}

                {(flower.city || shop?.city) && (
                  <p className="mt-1 text-xs text-slate-500">
                    Місто: {flower.city || shop?.city}
                  </p>
                )}

                {shop?.address && (
                  <p className="mt-1 text-xs text-slate-500">
                    Адреса: {shop.address}
                  </p>
                )}

                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {flower.price} грн{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (в наявності: {flower.stock})
                  </span>
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
