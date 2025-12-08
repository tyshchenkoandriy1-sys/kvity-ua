"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// імпорт компонента мапи (без SSR)
const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
});

type JoinedProfile = {
  id: string;
  shop_name: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

type FlowerRow = {
  id: string;
  name: string;
  type: string | null;
  price: number;
  city: string | null;
  photo: string | null;
  shop_id: string;
  profiles: JoinedProfile[] | null;
};

export type ShopOnMap = {
  shopId: string;
  shopName: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  minPrice: number;
  flowersCount: number;
};

// координати міст у нижньому регістрі
const CITY_COORDS: Record<string, [number, number]> = {
  "київ": [50.4501, 30.5234],
  "львів": [49.8397, 24.0297],
  "івано-франківськ": [48.9226, 24.7111],
};

export default function MapPage() {
  const searchParams = useSearchParams();

  // те, що приходить в урлі
  const rawCity = searchParams.get("city") || "";
  const rawType = searchParams.get("type") || "";
  const rawName = searchParams.get("name") || ""; // на майбутнє, якщо додамо пошук по назві

  const cityParam = rawCity.trim();
  const typeParam = rawType.trim();
  const nameParam = rawName.trim();

  const [loading, setLoading] = useState(true);
  const [flowers, setFlowers] = useState<FlowerRow[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // 1️⃣ Один раз тягнемо всі квіти з join'ом на profiles
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("flowers")
        .select(
          `
          id,
          name,
          type,
          price,
          city,
          photo,
          shop_id,
          profiles:shop_id (
            id,
            shop_name,
            address,
            city,
            lat,
            lng
          )
        `
        );

      if (error) {
        console.error("Error loading flowers for map:", error);
        setFlowers([]);
      } else {
        setFlowers((data || []) as FlowerRow[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  // 2️⃣ Фільтруємо квіти на клієнті по місту + назві + типу
  const filteredFlowers = useMemo(() => {
    const cityQuery = cityParam.toLowerCase();
    const typeQuery = typeParam.toLowerCase();
    const nameQuery = nameParam.toLowerCase();

    return flowers.filter((f) => {
      const profile = f.profiles?.[0];

      const cityValue =
        (f.city || profile?.city || "").toLowerCase();
      const typeValue = (f.type || "").toLowerCase();
      const nameValue = (f.name || "").toLowerCase();

      const cityMatch = !cityQuery || cityValue.includes(cityQuery);
      const typeMatch = !typeQuery || typeValue.includes(typeQuery);
      const nameMatch = !nameQuery || nameValue.includes(nameQuery);

      return cityMatch && typeMatch && nameMatch;
    });
  }, [flowers, cityParam, typeParam, nameParam]);

  // 3️⃣ Групуємо відфільтровані квіти по магазинах
  const shops: ShopOnMap[] = useMemo(() => {
    const map = new Map<string, ShopOnMap>();

    for (const f of filteredFlowers) {
      const profile = f.profiles?.[0];
      if (!profile) continue;

      const existing = map.get(profile.id);

      if (!existing) {
        map.set(profile.id, {
          shopId: profile.id,
          shopName: profile.shop_name,
          address: profile.address,
          city: profile.city,
          lat: profile.lat,
          lng: profile.lng,
          minPrice: f.price,
          flowersCount: 1,
        });
      } else {
        const minPrice = Math.min(existing.minPrice, f.price);
        map.set(profile.id, {
          ...existing,
          minPrice,
          flowersCount: existing.flowersCount + 1,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => a.minPrice - b.minPrice
    );
  }, [filteredFlowers]);

  // 4️⃣ Вираховуємо центр мапи
  const mapCenter: [number, number] = useMemo(() => {
    // якщо є магазин з координатами — беремо його
    const shopWithCoords = shops.find(
      (s) => s.lat != null && s.lng != null
    );
    if (shopWithCoords && shopWithCoords.lat && shopWithCoords.lng) {
      return [shopWithCoords.lat, shopWithCoords.lng];
    }

    // інакше — по місту з урла (без регістру)
    const key = cityParam.toLowerCase();
    if (key && CITY_COORDS[key]) {
      return CITY_COORDS[key];
    }

    // fallback — центр України
    return [49.0, 31.0];
  }, [shops, cityParam]);

  // 5️⃣ Текст активних фільтрів
  const activeFilterText = [
    cityParam && `Місто: ${cityParam}`,
    typeParam && `Тип: ${typeParam}`,
    nameParam && `Назва: ${nameParam}`,
  ]
    .filter(Boolean)
    .join(" · ") || "Усі міста, типи та назви";

  return (
    <main className="flex min-h-[500px] h-[calc(100vh-64px)] flex-col bg-slate-50 text-slate-900 md:flex-row">
      {/* Ліва колонка — список */}
      <section className="flex w-full max-w-full flex-col border-b border-slate-200 bg-white md:max-w-md md:border-b-0 md:border-r">
        <header className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-sm font-semibold text-slate-900">
            Магазини на мапі
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {activeFilterText}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <p className="text-sm text-slate-500">
              Немає магазинів за цими параметрами. Спробуй змінити місто,
              тип або назву квітів.
            </p>
          ) : (
            <ul className="space-y-3">
              {shops.map((shop) => {
                const isSelected = selectedShopId === shop.shopId;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${shop.address}, ${shop.city} ${shop.shopName}`
                )}`;

                return (
                  <li key={shop.shopId}>
                    <div
                      className={`w-full rounded-2xl border p-4 text-left text-sm shadow-sm transition ${
                        isSelected
                          ? "border-pink-500 bg-pink-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        onClick={() =>
                          setSelectedShopId(
                            isSelected ? null : shop.shopId
                          )
                        }
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {shop.shopName}
                          </p>
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                            від {shop.minPrice.toLocaleString("uk-UA")} грн
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {shop.city} · {shop.address}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Варіантів: {shop.flowersCount}
                        </p>
                      </button>

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() =>
                            setSelectedShopId(
                              isSelected ? null : shop.shopId
                            )
                          }
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Показати на мапі
                        </button>
                        <button
                          onClick={() => window.open(mapsUrl, "_blank")}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Google Maps
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Права колонка — мапа */}
      <section className="h-72 w-full border-t border-slate-200 md:h-full md:flex-1 md:border-t-0">
        <MapView
          center={mapCenter}
          shops={shops}
          selectedShopId={selectedShopId}
          onSelectShop={setSelectedShopId}
        />
      </section>
    </main>
  );
}
