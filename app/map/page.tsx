// app/map/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  photo_updated_at: string | null;
  created_at: string | null;
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

// прострочене оголошення (фото не оновлювалось > 48 год)
const isBlocked = (flower: { photo_updated_at: string | null; created_at: string | null }) => {
  const lastUpdateStr = flower.photo_updated_at || flower.created_at;
  if (!lastUpdateStr) return false;

  const lastUpdate = new Date(lastUpdateStr).getTime();
  const now = Date.now();
  const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

  return diffHours > 48;
};

export default function MapPage() {
  // 🔹 параметри з урла (читаємо на клієнті)
  const [cityParam, setCityParam] = useState("");
  const [typeParam, setTypeParam] = useState("");
  const [nameParam, setNameParam] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [flowers, setFlowers] = useState<FlowerRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, JoinedProfile>>({});
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // 🔹 для автопрокрутки списку магазинів
  const shopItemsRef = useRef<Record<string, HTMLLIElement | null>>({});

  // 0️⃣ Один раз читаємо query-параметри з URL на клієнті
  useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  const cityFromUrl = (params.get("city") || "").trim();
  const typeFromUrl = (params.get("type") || "").trim();
  const nameFromUrl = (params.get("name") || "").trim();
  const highlightShopId = (params.get("highlightShopId") || "").trim();

  setCityParam(cityFromUrl);
  setTypeParam(typeFromUrl);
  setNameParam(nameFromUrl);

  if (highlightShopId) {
    setSelectedShopId(highlightShopId);
  }
}, []);


  // 1️⃣ Тягнемо квіти + окремо профілі магазинів
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // 1) всі квіти (без join)
      const { data: flowersData, error: flowersError } = await supabase
        .from("flowers")
        .select("id, name, type, price, city, photo, shop_id, photo_updated_at, created_at");

      if (flowersError) {
        console.error("Error loading flowers for map:", flowersError);
        setFlowers([]);
        setProfilesMap({});
        setError("Не вдалося завантажити дані для мапи");
        setLoading(false);
        return;
      }

      const typedFlowers = (flowersData || []) as FlowerRow[];
      setFlowers(typedFlowers);

      // 2) витягнути всі shop_id і підвантажити профілі
      const shopIds = Array.from(
        new Set(
          typedFlowers
            .map((f) => f.shop_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (shopIds.length === 0) {
        setProfilesMap({});
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, shop_name, address, city, lat, lng")
        .in("id", shopIds);

      if (profilesError) {
        console.warn("Cannot load shop profiles for map:", profilesError);
        setProfilesMap({});
      } else {
        const map: Record<string, JoinedProfile> = {};
        (profilesData as JoinedProfile[]).forEach((p) => {
          map[p.id] = p;
        });
        setProfilesMap(map);
      }

      setLoading(false);
    };

    load();
  }, []);

  // 2️⃣ Фільтруємо квіти на клієнті + ховаємо прострочені (>48 год)
  const filteredFlowers = useMemo(() => {
    const cityQuery = cityParam.toLowerCase();
    const typeQuery = typeParam.toLowerCase();
    const nameQuery = nameParam.toLowerCase();

    return flowers.filter((f) => {
      // не показуємо прострочені
      if (isBlocked(f)) return false;

      const profile = profilesMap[f.shop_id];

      const cityValue = (f.city || profile?.city || "").toLowerCase();
      const typeValue = (f.type || "").toLowerCase();
      const nameValue = (f.name || "").toLowerCase();

      const cityMatch = !cityQuery || cityValue.includes(cityQuery);
      const typeMatch = !typeQuery || typeValue.includes(typeQuery);
      const nameMatch = !nameQuery || nameValue.includes(nameQuery);

      return cityMatch && typeMatch && nameMatch;
    });
  }, [flowers, profilesMap, cityParam, typeParam, nameParam]);

  // 3️⃣ Групуємо відфільтровані квіти по магазинах
  const shops: ShopOnMap[] = useMemo(() => {
    const map = new Map<string, ShopOnMap>();

    for (const f of filteredFlowers) {
      const profile = profilesMap[f.shop_id];
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

    return Array.from(map.values()).sort((a, b) => a.minPrice - b.minPrice);
  }, [filteredFlowers, profilesMap]);

  // 4️⃣ Квіти вибраного магазину (для блоку під мапою)
  const selectedShopFlowers = useMemo(
    () =>
      selectedShopId
        ? filteredFlowers.filter((f) => f.shop_id === selectedShopId)
        : [],
    [filteredFlowers, selectedShopId]
  );

  // 5️⃣ Центр мапи (з урахуванням вибраного магазину)
  const mapCenter: [number, number] = useMemo(() => {
    const selectedShop =
      selectedShopId &&
      shops.find(
        (s) =>
          s.shopId === selectedShopId &&
          s.lat != null &&
          s.lng != null
      );

    if (selectedShop && selectedShop.lat && selectedShop.lng) {
      return [selectedShop.lat, selectedShop.lng];
    }

    const shopWithCoords = shops.find(
      (s) => s.lat != null && s.lng != null
    );
    if (shopWithCoords && shopWithCoords.lat && shopWithCoords.lng) {
      return [shopWithCoords.lat, shopWithCoords.lng];
    }

    const key = cityParam.toLowerCase();
    if (key && CITY_COORDS[key]) {
      return CITY_COORDS[key];
    }

    return [49.0, 31.0];
  }, [shops, cityParam, selectedShopId]);

  // 6️⃣ Текст активних фільтрів
  const activeFilterText =
    [
      cityParam && `Місто: ${cityParam}`,
      typeParam && `Тип: ${typeParam}`,
      nameParam && `Назва: ${nameParam}`,
    ]
      .filter(Boolean)
      .join(" · ") || "Усі міста, типи та назви";

  const selectedShop = useMemo(
    () =>
      selectedShopId
        ? shops.find((s) => s.shopId === selectedShopId) ?? null
        : null,
    [shops, selectedShopId]
  );

  // 7️⃣ Автопрокрутка до вибраного магазину у списку
  useEffect(() => {
    if (!selectedShopId) return;
    const el = shopItemsRef.current[selectedShopId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedShopId]);

  // 8️⃣ хендлер для очищення фільтрів
  const handleClearFilters = () => {
    setCityParam("");
    setTypeParam("");
    setNameParam("");
    setSelectedShopId(null);
  };

  return (
    <main className="flex min-h-[500px] h-[calc(100vh-64px)] flex-col bg-slate-50 text-slate-900">
      {/* Верхній блок: список + мапа */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Ліва колонка — список */}
        <section className="flex w-full max-w-full flex-col border-b border-slate-200 bg-white md:max-w-md md:border-b-0 md:border-r">
          <header className="border-b border-slate-200 px-4 py-3">
            <h1 className="text-sm font-semibold text-slate-900">
              Магазини на мапі
            </h1>
            <p className="mt-1 text-xs text-slate-500">{activeFilterText}</p>
            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}

            {/* 🔹 Фільтри на мапі */}
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
              <div className="flex flex-col gap-2">
                <input
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  placeholder="Місто (наприклад, Київ)"
                  value={cityParam}
                  onChange={(e) => setCityParam(e.target.value)}
                />
                <input
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  placeholder="Тип (Квіти, Букети, Вазони...)"
                  value={typeParam}
                  onChange={(e) => setTypeParam(e.target.value)}
                />
                <input
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  placeholder="Назва (троянда, букет піонів...)"
                  value={nameParam}
                  onChange={(e) => setNameParam(e.target.value)}
                />
              </div>
              <button
                onClick={handleClearFilters}
                className="mt-1 self-start rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Очистити фільтри
              </button>
            </div>
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
                    <li
                      key={shop.shopId}
                      ref={(el) => {
                        shopItemsRef.current[shop.shopId] = el;
                      }}
                    >
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
      </div>

      {/* Нижній блок — квіти вибраного магазину */}
      <section className="w-full border-t border-slate-200 bg-white px-4 py-4 md:px-6 md:py-5">
        {selectedShop && selectedShopFlowers.length > 0 ? (
          <>
            <h2 className="text-sm font-semibold text-slate-900 md:text-base">
              Квіти магазину: {selectedShop.shopName}
            </h2>
            <p className="mt-1 text-xs text-slate-500 md:text-sm">
              Місто: {selectedShop.city} · Адреса: {selectedShop.address}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedShopFlowers.map((flower) => (
                <article
                  key={flower.id}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"
                >
                  <div className="h-32 w-full bg-slate-100">
                    {flower.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={flower.photo}
                        alt={flower.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        Без фото
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {flower.name}
                    </h3>
                    {flower.type && (
                      <p className="mt-1 text-xs text-slate-500">
                        Тип: {flower.type}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {flower.price.toLocaleString("uk-UA")} грн
                    </p>

                    <a
                      href={`/order/${flower.id}`}
                      className="mt-3 inline-flex items-center justify-center rounded-xl bg-pink-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-pink-600"
                    >
                      Замовити
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : selectedShopId ? (
          <p className="text-sm text-slate-500">
            У цього магазину немає квітів за поточними фільтрами. Змініть
            пошук або оберіть інший магазин.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Оберіть магазин у списку або на мапі, щоб побачити його квіти.
          </p>
        )}
      </section>
    </main>
  );
}
