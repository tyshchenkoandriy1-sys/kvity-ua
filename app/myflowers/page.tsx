// app/myflowers/page.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
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
  sold_count: number | null;
  photo_updated_at: string | null;
  created_at: string | null;

  // поля для знижок (оновлено)
  sale_price: number | null;
  is_on_sale: boolean;
  discount_label: string | null;
};

export default function MyFlowersPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [photoUploadingId, setPhotoUploadingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
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

    const { data: flowersData, error: flowersError } = await supabase
      .from("flowers")
      .select("*")
      .eq("shop_id", session.user.id)
      .order("created_at", { ascending: false });

    if (flowersError) {
      setError("Не вдалося завантажити ваші квіти");
    } else {
      // гарантуємо дефолтні значення для нових полів
      const normalized = ((flowersData as any[]) || []).map((f) => ({
        ...f,
        sale_price: f.sale_price ?? null,
        is_on_sale: f.is_on_sale ?? false,
        discount_label: f.discount_label ?? null,
      })) as Flower[];

      setFlowers(normalized);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleChangeField = (
    id: string,
    field: "price" | "stock" | "sale_price",
    value: string
  ) => {
    setFlowers((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              [field]: Number(value) || 0,
            }
          : f
      )
    );
  };

  const handleChangeDiscountLabel = (id: string, value: string) => {
    setFlowers((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              discount_label: value,
            }
          : f
      )
    );
  };

  const handleToggleSale = (id: string, checked: boolean) => {
    setFlowers((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;

        const sale_price =
          checked && (f.sale_price == null || f.sale_price === 0)
            ? f.price
            : f.sale_price;

        return {
          ...f,
          is_on_sale: checked,
          sale_price,
          discount_label:
            checked && !f.discount_label ? "Знижка" : f.discount_label,
        };
      })
    );
  };

  const handleUpdate = async (flower: Flower) => {
    setSavingId(flower.id);
    setError(null);

    // якщо знижка вимкнена — очищаємо sale_price та discount_label
    const payload = {
      price: flower.price,
      stock: flower.stock,
      is_on_sale: flower.is_on_sale,
      sale_price: flower.is_on_sale ? flower.sale_price : null,
      discount_label: flower.is_on_sale ? flower.discount_label : null,
    };

    const { error } = await supabase
      .from("flowers")
      .update(payload)
      .eq("id", flower.id);

    if (error) {
      console.error(error);
      setError("Не вдалося оновити квітку");
    }

    setSavingId(null);
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("Точно видалити це оголошення?");
    if (!ok) return;

    setDeletingId(id);
    setError(null);

    const { error } = await supabase.from("flowers").delete().eq("id", id);

    if (error) {
      console.error(error);
      setError("Не вдалося видалити квітку");
      setDeletingId(null);
      return;
    }

    setFlowers((prev) => prev.filter((f) => f.id !== id));
    setDeletingId(null);
  };

  // аплоад нового фото
  const handlePhotoChange = async (
    flowerId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploadingId(flowerId);
    setError(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setError("Потрібно увійти в акаунт, щоб змінити фото");
      setPhotoUploadingId(null);
      return;
    }

    const path = `${session.user.id}/${flowerId}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from("flowers")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      setError("Не вдалося завантажити фото");
      setPhotoUploadingId(null);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("flowers")
      .getPublicUrl(path);

    const publicUrl = publicUrlData.publicUrl;
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("flowers")
      .update({
        photo: publicUrl,
        photo_updated_at: nowIso,
      })
      .eq("id", flowerId);

    if (updateError) {
      console.error(updateError);
      setError("Фото оновлено, але не вдалося зберегти зміни в оголошенні");
      setPhotoUploadingId(null);
      return;
    }

    setFlowers((prev) =>
      prev.map((f) =>
        f.id === flowerId
          ? { ...f, photo: publicUrl, photo_updated_at: nowIso }
          : f
      )
    );

    setPhotoUploadingId(null);
  };

  const isBouquet = (type: string | null) => {
    const t = (type || "").toLowerCase();
    return t.includes("букет");
  };

  const isBlocked = (flower: Flower) => {
    const lastUpdateStr = flower.photo_updated_at || flower.created_at;
    if (!lastUpdateStr) return false;

    const lastUpdate = new Date(lastUpdateStr).getTime();
    const now = Date.now();
    const diffHours = (now - lastUpdate) / (1000 * 60 * 60);
    return diffHours > 48;
  };

  const totalSold =
    flowers.reduce((sum, f) => sum + (f.sold_count ?? 0), 0) || 0;

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
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-red-500 mb-4">{error ?? "Профіль не знайдено"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white"
          >
            До кабінету
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-2">Мої квіти</h1>
        <p className="text-slate-600 mb-1">
          Магазин: <span className="font-semibold">{profile.shop_name}</span>
        </p>
        <p className="text-slate-600 mb-6">
          Усього продано:{" "}
          <span className="font-semibold">{totalSold}</span> шт.
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!flowers.length && (
          <p className="text-slate-600">
            У вас ще немає доданих квітів. Додайте першу на сторінці{" "}
            <button
              className="text-slate-900 font-semibold underline"
              onClick={() => router.push("/addflower")}
            >
              додавання квітки
            </button>
            .
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flowers.map((flower) => {
            const blocked = isBlocked(flower);
            const bouquet = isBouquet(flower.type);

            const hasValidSale =
              flower.is_on_sale &&
              flower.sale_price != null &&
              flower.sale_price > 0 &&
              flower.sale_price < flower.price;

            return (
              <div
                key={flower.id}
                className={`bg-white rounded-2xl shadow p-4 flex flex-col transition ${
                  blocked ? "opacity-70" : ""
                }`}
              >
                <div className="relative mb-3">
                  {flower.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={flower.photo}
                      alt={flower.name}
                      className="h-32 w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-32 w-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm rounded-lg">
                      Без фото
                    </div>
                  )}

                  <label className="absolute bottom-2 right-2 inline-flex cursor-pointer rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-white">
                    {photoUploadingId === flower.id
                      ? "Завантаження..."
                      : "Змінити фото"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(flower.id, e)}
                      disabled={photoUploadingId === flower.id}
                    />
                  </label>
                </div>

                <h2 className="font-semibold text-lg mb-1">{flower.name}</h2>

                {bouquet && (
                  <span className="inline-flex w-fit rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-semibold text-pink-700 mb-1">
                    Категорія: букети
                  </span>
                )}

                {hasValidSale && (
                  <span className="inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 mb-1">
                    {flower.discount_label || "Знижка"}
                  </span>
                )}

                {flower.type && (
                  <p className="text-sm text-slate-500 mb-1">
                    Тип: {flower.type}
                  </p>
                )}
                {flower.city && (
                  <p className="text-sm text-slate-500 mb-1">
                    Місто: {flower.city}
                  </p>
                )}
                <p className="text-sm text-slate-500 mb-2">
                  Продано: {flower.sold_count ?? 0} шт.
                </p>

                {blocked && (
                  <p className="mb-2 text-xs font-semibold text-red-500">
                    Оголошення заблоковано. Онови фото — воно повинно
                    змінюватися щонайменше раз на 48 годин.
                  </p>
                )}

                {/* Ціни */}
                <div className="mt-1 mb-2">
                  {hasValidSale ? (
                    <>
                      <p className="text-sm text-slate-500">Ціна, грн за шт:</p>
                      <p className="text-sm">
                        <span className="mr-2 text-slate-400 line-through">
                          {flower.price.toLocaleString("uk-UA")} грн
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {flower.sale_price!.toLocaleString("uk-UA")} грн
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <label className="text-sm text-slate-500">
                        Ціна, грн за шт:
                      </label>
                      <input
                        className="w-full border rounded-lg px-2 py-1 mb-2 text-sm"
                        value={flower.price}
                        onChange={(e) =>
                          handleChangeField(
                            flower.id,
                            "price",
                            e.target.value
                          )
                        }
                      />
                    </>
                  )}
                </div>

                {!hasValidSale && (
                  <>
                    <label className="text-sm text-slate-500">
                      Кількість на складі:
                    </label>
                    <input
                      className="w-full border rounded-lg px-2 py-1 mb-3 text-sm"
                      value={flower.stock}
                      onChange={(e) =>
                        handleChangeField(
                          flower.id,
                          "stock",
                          e.target.value
                        )
                      }
                    />
                  </>
                )}

                {/* Блок знижки / акції */}
                <div className="mt-2 mb-3 rounded-xl bg-slate-50 p-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={flower.is_on_sale}
                      onChange={(e) =>
                        handleToggleSale(flower.id, e.target.checked)
                      }
                    />
                    Знижка / акція для цього товару
                  </label>

                  {flower.is_on_sale && (
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-xs text-slate-500">
                          Нова ціна (зі знижкою), грн за шт:
                        </label>
                        <input
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          value={flower.sale_price ?? ""}
                          onChange={(e) =>
                            handleChangeField(
                              flower.id,
                              "sale_price",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">
                          Текст бейджа знижки
                        </label>
                        <input
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          placeholder="Наприклад: Знижка, -20%, Акція"
                          value={flower.discount_label ?? ""}
                          onChange={(e) =>
                            handleChangeDiscountLabel(
                              flower.id,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleUpdate(flower)}
                    disabled={savingId === flower.id || blocked}
                    className="flex-1 py-1 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {savingId === flower.id ? "Збереження..." : "Зберегти"}
                  </button>
                  <button
                    onClick={() => handleDelete(flower.id)}
                    disabled={deletingId === flower.id}
                    className="flex-1 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:bg-red-300"
                  >
                    {deletingId === flower.id ? "Видалення..." : "Видалити"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
