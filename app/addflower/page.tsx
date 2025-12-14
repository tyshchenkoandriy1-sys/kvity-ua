"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const CATEGORY_OPTIONS = ["Квіти", "Вазони", "Букети", "Композиції"];

export default function AddFlowerPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  // група товару
  const [category, setCategory] = useState("");
  // детальний тип усередині групи
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [file, setFile] = useState<File | null>(null);

  // НОВЕ: опис і склад для букетів/вазонів/композицій
  const [description, setDescription] = useState("");
  const [compositionFlowers, setCompositionFlowers] = useState("");

  const isComplexCategory = ["Букети", "Вазони", "Композиції"].includes(
    category
  );

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !data) {
        setError("Помилка профілю");
      } else if (data.role !== "seller") {
        setError("Доступ лише для продавців");
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !price) {
      setError("Назва та ціна обовʼязкові");
      return;
    }

    if (!category) {
      setError("Оберіть категорію (квіти, вазони, букети або композиції)");
      return;
    }

    // для букетів/вазонів/композицій бажано мати опис
    if (isComplexCategory && !description.trim()) {
      setError("Для букетів, вазонів та композицій додайте, будь ласка, опис.");
      return;
    }

    let photoUrl: string | null = null;

    // 📸 Якщо файл є — завантажуємо
    if (file && profile) {
      const fileName = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("flowers") // bucket
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        setError("Помилка завантаження фото");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("flowers")
        .getPublicUrl(fileName);

      photoUrl = urlData.publicUrl;
    }

    // комбінований тип: "Букети · піоновидна"
    const combinedType =
      category && type ? `${category} · ${type}` : category || type || null;

    // 📌 Додаємо товар
    const { error: insertError } = await supabase.from("flowers").insert({
      shop_id: profile.id,
      name,
      type: combinedType,
      price: Number(price),
      stock: Number(stock),
      photo: photoUrl,
      city: profile.city || null, // місто беремо з профілю

      // НОВІ ПОЛЯ — переконайся, що вони є в таблиці flowers
      description: description || null,
      composition_flowers: compositionFlowers || null,
    });

    if (insertError) {
      console.error(insertError);
      setError("Помилка додавання оголошення");
      return;
    }

    setSuccess("Оголошення додано 🌷");
    setName("");
    setCategory("");
    setType("");
    setPrice("");
    setStock("0");
    setFile(null);
    setDescription("");
    setCompositionFlowers("");
  };

  if (loading) return <p className="p-6">Завантаження...</p>;

  if (error)
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow mt-10">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold"
        >
          До кабінету
        </button>
      </div>
    );

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Додати товар 🌸</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Назва *</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="Наприклад, троянда червона"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Категорія *</label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
           text-slate-800 outline-none focus:border-pink-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Оберіть категорію</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">
            Детальний тип (необовʼязково)
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="піоновидна, кущова, мікс тощо"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>

        {isComplexCategory && (
          <>
            <div>
              <label className="block text-sm mb-1">Опис*</label>
              <textarea
                className="w-full p-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Наприклад: ніжний букет з піонів та троянд, у пастельних тонах..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                Квіти в складі (через кому)
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="піони, троянди, евкаліпт"
                value={compositionFlowers}
                onChange={(e) => setCompositionFlowers(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Це поле допоможе покупцям знаходити букети за складом.
              </p>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm mb-1">Ціна за шт *</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="Наприклад, 150"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Кількість на складі</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Фото</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-semibold"
        >
          Додати оголошення
        </button>
      </form>

      {success && <p className="mt-4 text-green-600 text-sm">{success}</p>}
    </div>
  );
}
