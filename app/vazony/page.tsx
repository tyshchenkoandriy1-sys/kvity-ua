// app/vazony/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Vazony = {
  id: string;
  name: string;
  type: string | null;
  price: number;
  stock: number;
  photo: string | null;
  city: string | null;
  shop_id: string;

  // поля для знижок (як у flowers)
  discount_price: number | null;
  discount_label: string | null;
};

type ShopProfile = {
  id: string;
  shop_name: string | null;
  address: string | null;
  city: string | null;
};

type ShopsMap = Record<string, ShopProfile>;

export default function VazonyPage() {
  const router = useRouter();

  const [vazony, setVazony] = useState<Vazony[]>([]);
  const [shops, setShops] = useState<ShopsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cityFilter, setCityFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchVazony = async () => {
    setLoading(true);
    setError(null);

    // беремо тільки вазони
    let query = supabase
      .from("flowers")
      .select(
        `
        id,
        name,
        type,
        price,
        stock,
        photo,
        city,
        shop_id,
        discount_price,
        discount_label
      `
      )
      .ilike("type", "Вазони%")
      .order("created_at", { ascending: false });

    if (cityFilter) {
      query = query.ilike("city", `%${cityFilter}%`);
    }

    if (nameFilter) {
      query = query.ilike("name", `%${nameFilter}%`);
    }

    if (maxPrice) {
      const priceNumber = Number(maxPrice);
      if (!isNaN(priceNumber) && priceNumber > 0) {
        query = query.lte("price", priceNumber);
      }
    }

    const { data, error: vazonyError } = await query;

    if (vazonyError) {
      console.error(vazonyError);
      setError("Не вдалося завантажити вазони");
      setLoading(false);
      return;
    }

    const typed = (data as Vazony[]) || [];
    setVazony(typed);

    // підтягуємо магазини
    const shopIds = Array.from(
      new Set(
        typed
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
        console.warn("Cannot load shops for vazony:", shopsError);
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
    fetchVazony();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Заголовок */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Вазони 🪴
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Живі кімнатні рослини та вазони від локальних магазинів.
          </p>
        </header>

        {/* Фільтри */}
        <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100"
              placeholder="Місто (наприклад, Київ)"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100"
              placeholder="Назва рослини (фікуc, монстера...)"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <div className="flex gap-3 md:w-56">
              <input
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100"
                placeholder="Макс. ціна"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <button
                onClick={fetchVazony}
                className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600"
              >
                Пошук
              </button>
            </div>
          </div>
        </section>

        {loading && (
          <p className="text-sm text-slate-600">Завантаження вазонів...</p>
        )}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {!loading && !vazony.length && !error && (
          <p className="text-sm text-slate-600">
            Наразі немає вазонів за цими фільтрами.
          </p>
        )}

        {/* Список вазонів */}
        <section className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vazony.map((item) => {
            const shop = shops[item.shop_id];

            const hasDiscount =
              item.discount_price !== null &&
              !isNaN(Number(item.discount_price));
            const finalPrice = hasDiscount
              ? Number(item.discount_price)
              : item.price;

            const discountText =
              item.discount_label && item.discount_label.trim().length > 0
                ? item.discount_label
                : "Знижка";

            const handleShowOnMap = () => {
              const city = shop?.city || item.city || "";
              const address = shop?.address || "";
              const label = shop?.shop_name || item.name;

              const params = new URLSearchParams();
              if (city) params.set("city", city);
              if (item.type) params.set("type", item.type);
              if (item.name) params.set("name", item.name);

              // наша внутрішня мапа
              router.push(`/map?${params.toString()}`);
            };

            return (
              <article
                key={item.id}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative">
                  {item.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo}
                      alt={item.name}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-50 text-sm text-slate-400">
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
                    {item.name}
                  </h2>

                  {shop?.shop_name && (
                    <p className="mt-1 text-xs text-slate-600">
                      Магазин: {shop.shop_name}
                    </p>
                  )}

                  {(item.city || shop?.city) && (
                    <p className="text-xs text-slate-500">
                      Місто: {item.city || shop?.city}
                    </p>
                  )}

                  {shop?.address && (
                    <p className="text-[11px] text-slate-500">
                      Адреса: {shop.address}
                    </p>
                  )}

                  {item.type && (
                    <p className="mt-1 text-xs text-slate-500">
                      Тип: {item.type}
                    </p>
                  )}

                  {/* Ціни + залишок */}
                  <div className="mt-3 flex items-baseline gap-2">
                    {hasDiscount && (
                      <p className="text-xs text-slate-400 line-through">
                        {item.price.toLocaleString("uk-UA")} грн
                      </p>
                    )}
                    <p className="text-sm font-semibold text-slate-900">
                      {finalPrice.toLocaleString("uk-UA")} грн{" "}
                      <span className="text-xs font-normal text-slate-500">
                        {item.stock > 0
                          ? `(в наявності: ${item.stock})`
                          : "(нема в наявності)"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/order/${item.id}`)}
                      disabled={item.stock <= 0}
                      className={`w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        item.stock > 0
                          ? "bg-pink-500 text-white hover:bg-pink-600"
                          : "cursor-not-allowed bg-slate-200 text-slate-400"
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
