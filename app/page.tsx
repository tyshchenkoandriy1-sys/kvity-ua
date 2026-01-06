// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { trackSearch } from "@/lib/ga";
import { gaEvent } from "@/lib/ga";



const CITIES = ["Київ", "Львів", "Івано-Франківськ"];
const FLOWER_TYPES = ["Квіти", "Вазони", "Букети", "Композиції"];

type Flower = {
  id: number;
  name: string;
  type: string;
  price: number;
  city: string;
  photo: string | null;
  sold_count: number;

  // ✅ додано
  stock: number;
  is_active: boolean;

  // ✅ додано (завдання)
  created_at: string | null;
  photo_updated_at: string | null;

  shop_name: string;
  address: string;

  // знижки
  is_on_sale: boolean;
  sale_price: number | null;
  discount_label: string | null;
};
// ✅ Нормалізація пошукового тексту (keyword search)
const normalize = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => w.length >= 2);

// ✅ Склеюємо name + color в один keyword-запит
const buildSearchQuery = (name: string, color: string) => {
  const combined = `${name ?? ""} ${color ?? ""}`.trim();
  const words = normalize(combined);
  return words.join(" ");
};


export default function HomePage() {
  const router = useRouter();

  const [city, setCity] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [flowerName, setFlowerName] = useState<string>("");
  const [flowerColor, setFlowerColor] = useState<string>(""); // 🔹 нове
  const [loading, setLoading] = useState(true);
  const [featuredFlowers, setFeaturedFlowers] = useState<Flower[]>([]);

  // підвантажуємо «каталог на головній»
  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);

      // ✅ дата 48 год назад (завдання)
      const cutoffIso = new Date(
        Date.now() - 48 * 60 * 60 * 1000
      ).toISOString();

      // ✅ оновлений запит + фільтри is_active + stock + 48 год (завдання)
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
          sold_count,
          stock,
          is_active,
          created_at,
          photo_updated_at,
          is_on_sale,
          sale_price,
          discount_label,
          profiles:shop_id (
            shop_name,
            address
          )
        `
        )
        .eq("is_active", true)
        .gt("stock", 0)
        // ✅ не показувати якщо не оновлювали більше 48 год:
        .or(
          `photo_updated_at.gte.${cutoffIso},and(photo_updated_at.is.null,created_at.gte.${cutoffIso})`
        )
        .order("created_at", { ascending: false })
        .limit(9);

      // ✅ FIX: якщо помилка — очищаємо список, щоб не показувати старі дані
      if (error) {
        console.error(error);
        setFeaturedFlowers([]);
        setLoading(false);
        return;
      }

      if (data) {
        const mapped: Flower[] = data.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type ?? "",
          price: f.price ?? 0,
          city: f.city ?? "",
          photo: f.photo ?? null,
          sold_count: f.sold_count ?? 0,

          // ✅ додано
          stock: f.stock ?? 0,
          is_active: f.is_active ?? true,

          // ✅ додано (завдання)
          created_at: f.created_at ?? null,
          photo_updated_at: f.photo_updated_at ?? null,

          shop_name: f.profiles?.shop_name ?? "Квітковий магазин",
          address: f.profiles?.address ?? "",

          is_on_sale: f.is_on_sale ?? false,
          sale_price: f.sale_price ?? null,
          discount_label: f.discount_label ?? null,
        }));

        setFeaturedFlowers(mapped);
      } else {
        setFeaturedFlowers([]);
      }

      setLoading(false);
    };

    loadFeatured();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = buildSearchQuery(flowerName, flowerColor);
    trackSearch({
  city,
  type,
  flowerName,
  color: flowerColor,
});


    // якщо вибрали одну з груп — перекидаємо на окремі сторінки
    if (type === "Букети") {
      router.push("/bukety");
      return;
    }
    if (type === "Вазони") {
      router.push("/vazony");
      return;
    }
    if (type === "Композиції") {
      router.push("/kompozytsii");
      return;
    }

    // інакше — стандартний каталог квітів поштучно
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (q) params.set("q", q);

    router.push(`/flowers?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
            

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-20">
          <div className="flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/logo.png" alt="" className="h-4 w-4 rounded-md" />
  KVITY.INFO · маркетплейс квіткових магазинів
</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Квіти поруч з тобою 🌸
            </h1>
            <p className="max-w-xl text-base text-slate-600 md:text-lg">
              Знаходь живі букети у квіткових магазинах твого міста. Обирай за
              фото, ціною та відстанню — без довгих дзвінків та пояснень.
            </p>

            {/* основні кнопки */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/flowers"
                className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600"
              >
                Знайти квіти
              </Link>
              <Link
                href="/sales"
                className="rounded-xl border border-pink-200 bg-white px-5 py-2.5 text-sm font-semibold text-pink-600 shadow-sm transition hover:bg-pink-50"
              >
                Знижки та акції
              </Link>
            </div>

            {/* Швидкий пошук */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-6 shadow-md sm:flex-row sm:items-end"
            >
              {/* Місто */}
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Місто
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="">Будь-яке місто</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Тип */}
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Тип
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="">Будь-що</option>
                  {FLOWER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Назва квітки */}
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Назва квітки
                </label>
                <input
                  value={flowerName}
                  onChange={(e) => setFlowerName(e.target.value)}
                  placeholder="Напр., троянда, тюльпан..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Колір */}
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Колір
                </label>
                <input
                  value={flowerColor}
                  onChange={(e) => setFlowerColor(e.target.value)}
                  placeholder="Напр., червоний, білий..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Кнопка */}
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-slate-800 sm:w-auto"
              >
                Пошук
              </button>
            </form>
          </div>

          {/* Декоративний блок / превʼю */}
          <div className="relative mt-6 flex flex-1 justify-center md:mt-0">
            <div className="relative h-64 w-full max-w-xs rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-slate-50 p-4 shadow-xl">
              <div className="flex h-full flex-col justify-between rounded-2xl bg-white/80 p-4 backdrop-blur">
                <div>
                  <p className="text-xs font-semibold text-pink-600">
                    Знайдено магазини
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    Київ · Львів · Франківськ
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Букет “Ніжність”
                      </p>
                      <p className="text-[11px] text-slate-800">
                        від 650 грн · 350 м
                      </p>
                    </div>
                    <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-700">
                      Популярне
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Троянди червоні
                      </p>
                      <p className="text-[11px] text-slate-800">від 90 грн / шт</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Знижка
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-800">
                  KVITY.INFO — маркетплейс квіткових магазинів поруч з тобою 💐
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
  <h2 className="text-xl font-bold text-slate-900">
    Купити квіти та букети онлайн у своєму місті
  </h2>

  <p className="mt-4 text-sm text-slate-800">
    KVITY.INFO — це онлайн маркетплейс квіткових магазинів, який допомагає
    швидко знайти та купити квіти поруч з тобою. Ми об’єднуємо локальні
    квіткові магазини в одному місці, щоб ти міг обрати букет за фото,
    ціною та відстанню.
  </p>

  <p className="mt-3 text-sm text-slate-800">
    На KVITY.INFO ти знайдеш живі квіти, букети, вазони та композиції у
    містах Київ, Львів та Івано-Франківськ. Обирай квіти онлайн без
    зайвих дзвінків — просто залиш заявку, і магазин зв’яжеться з тобою.
  </p>
</section>


      {/* 📌 КАТАЛОГ НА ГОЛОВНІЙ */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-14">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Каталог квітів поруч
            </h2>
            <p className="mt-1 text-sm text-slate-800">
              Квіти поштучно, букети, вазони та композиції. Частина з них — зі
              знижками та акціями.
            </p>
          </div>
          <Link
            href="/sales"
            className="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 md:inline-flex"
          >
            Переглянути всі знижки
          </Link>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 h-36 rounded-xl bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                <div className="mt-4 h-3 w-1/3 rounded bg-slate-100" />
              </div>
            ))
          ) : featuredFlowers.length === 0 ? (
            <p className="text-sm text-slate-800">
              Поки немає активних оголошень. Додай перші як продавець 🌱
            </p>
          ) : (
            featuredFlowers.map((flower) => (
              <FlowerCard key={flower.id} flower={flower} />
            ))
          )}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            href="/sales"
            className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            Переглянути всі знижки
          </Link>
        </div>
      </section>

      {/* ЯК ЦЕ ПРАЦЮЄ */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
          Як працює KVITY.INFO?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-800 md:text-base">
          Все просто — кілька кроків для покупців та продавців.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            {
              step: "1",
              title: "Обери місто",
              text: "Вкажи, де ти зараз: Київ, Львів або Франківськ.",
            },
            {
              step: "2",
              title: "Знайди квіти",
              text: "Фільтруй за типом квітів, ціною, популярністю.",
            },
            {
              step: "3",
              title: "Залиш замовлення",
              text: "Введи ім’я та телефон — без складної реєстрації.",
            },
            {
              step: "4",
              title: "Магазин звʼяжеться",
              text: "Флорист підтвердить замовлення й узгодить деталі.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-800">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ДЛЯ ПРОДАВЦІВ */}
      <section className="bg-slate-900 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-300">
                Для квіткових магазинів
              </p>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Додай свій магазин на KVITY.INFO 💐
              </h2>
              <p className="text-sm text-slate-300 md:text-base">
                Отримуй нових клієнтів без власного дорогого сайту. Проста
                реєстрація, особистий кабінет, статистика продажів та зручна
                робота з замовленнями.
              </p>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>• Онлайн-вітрина з реальними фото букетів</li>
                <li>• Простий кабінет продавця без складної адмінки</li>
                <li>• Статистика замовлень та проданих квітів</li>
                <li>• Підтримка через Telegram</li>
              </ul>
              <div className="pt-3">
                <Link
                  href="/partner"
                  className="inline-flex items-center rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600"
                >
                  Стати партнером KVITY.INFO
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-800/80 p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-white">
                Що ти побачиш у кабінеті продавця:
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>✅ Список твоїх квітів з цінами та залишками</li>
                <li>✅ Нові замовлення з контактами покупця</li>
                <li>✅ Статуси: нове, в роботі, виконано, скасовано</li>
                <li>✅ Статистика: скільки продано (sold_count)</li>
              </ul>
              <p className="mt-4 text-xs text-slate-600">
                Після реєстрації твій магазин потрапляє в статус
                <span className="font-semibold text-emerald-300"> pending</span>{" "}
                — ми підтверджуємо його, і ти стаєш{" "}
                <span className="font-semibold text-emerald-300">seller</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* КОНТАКТИ / ФУТЕР */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">KVITY.INFO</h3>
              <p className="mt-2 text-xs text-slate-800">
                Маркетплейс локальних квіткових магазинів. Проєкт junior
                розробника на Next.js + Supabase.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Для покупців
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-800">
                <li>
                  <Link href="/flowers" className="hover:text-slate-800">
                    Каталог квітів
                  </Link>
                </li>
                <li>
                  <Link href="/sales" className="hover:text-slate-800">
                    Знижки та акції
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-slate-800">
                    Про сервіс
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-slate-800">
                    FAQ
                  </Link>
                </li>
                <li>
  <Link href="/privacy" className="hover:text-slate-800">
    Політика конфіденційності
  </Link>
</li>
<li>
  <Link href="/terms" className="hover:text-slate-800">
    Умови користування
  </Link>
</li>


              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Контакти</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-800">
                <li>
                  Email: <span className="font-mono">flower.work001@gmail.com</span>
                </li>
                <li>
                  Telegram:{""}
                  <a
                    href="https://t.me/kvityinfo"
                    target="_blank"
                    className="text-pink-600 hover:text-pink-700"
                  >
                    @kvityinfo
                  </a>
                </li>
                <li>
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-600">
            © {new Date().getFullYear()} KVITY.INFO · зроблено людьми для людей.
          </p>
        </div>
      </footer>
    </main>
  );
}

// Картка з бейджами «знижка» та «популярне»
function FlowerCard({ flower }: { flower: Flower }) {
  const router = useRouter();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${flower.address}, ${flower.city} ${flower.shop_name}`
  )}`;

  const isTop = flower.sold_count >= 5;
  const isBouquetLike =
    flower.type?.includes("Букети") || flower.type?.includes("Композиції");

  const hasSale =
    flower.is_on_sale &&
    flower.sale_price != null &&
    flower.sale_price > 0 &&
    flower.sale_price < flower.price;

  const finalPrice =
    hasSale && flower.sale_price != null ? flower.sale_price : flower.price;

  const handleMapClick = () => {
    if (isBouquetLike) {
      window.open(mapsUrl, "_blank");
    } else {
      const params = new URLSearchParams();
      if (flower.city) params.set("city", flower.city);
      if (flower.type) params.set("type", flower.type);
      router.push(`/map?${params.toString()}`);
    }
  };

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative mb-3 overflow-hidden rounded-xl bg-slate-100">
        {flower.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flower.photo}
            alt={flower.name}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center text-xs text-slate-600">
            Без фото
          </div>
        )}

        <div className="absolute left-2 top-2 flex gap-1">
          {hasSale && (
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              {flower.discount_label || "Знижка"}
            </span>
          )}
          {isTop && (
            <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
              Популярне
            </span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-900">{flower.name}</h3>
      <p className="mt-1 text-xs text-slate-800">
        {flower.type} · {flower.city}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        {hasSale && (
          <p className="text-xs text-slate-600 line-through">
            {flower.price.toLocaleString("uk-UA")} грн
          </p>
        )}
        <p className="text-sm font-semibold text-slate-900">
          {finalPrice.toLocaleString("uk-UA")} грн
        </p>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-slate-800">
        {flower.shop_name} · {flower.address}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
       <Link
  href={`/order/${flower.id}`}
  onClick={() => {
    gaEvent("order_start", {
      flower_id: flower.id,
      flower_name: flower.name,
      city: flower.city,
      price: flower.price,
      is_sale: flower.is_on_sale,
    });
  }}
  className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white"
>
  {hasSale ? "Замовити зі знижкою" : "Замовити"}
</Link>

        <button
          type="button"
          onClick={handleMapClick}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          На мапі
        </button>
      </div>
    </article>
  );
}
