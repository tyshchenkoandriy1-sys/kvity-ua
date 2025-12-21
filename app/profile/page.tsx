"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // локальні стейти для редагування
  const [shopName, setShopName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const CITIES = ["Київ", "Львів", "Івано-Франківськ"];

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      setEmail(session.user.email ?? null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !data) {
        setError("Не вдалося завантажити профіль");
        setLoading(false);
        return;
      }

      // ✅ seller або admin (щоб не “ламалось” після того як ти став адміном)
      if (!["seller", "admin"].includes(data.role)) {
        setError("Сторінка профілю продавця доступна лише для продавців.");
        setLoading(false);
        return;
      }

      setProfile(data);

      // ініціалізуємо інпути
      setShopName(data.shop_name ?? "");
      setContact(data.contact ?? "");
      setCity(data.city ?? "");
      setAddress(data.address ?? "");

      setLoading(false);
    };

    load();
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const fileName = `${profile.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError("Помилка завантаження аватара");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", profile.id);

    if (updateError) {
      setError("Не вдалося оновити профіль");
    } else {
      setProfile({ ...profile, avatar_url: avatarUrl });
      setSuccess("Аватар оновлено ✅");
    }

    setUploading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        shop_name: shopName || null,
        contact: contact || null,
        city: city || null,
        address: address || null,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error(updateError);
      setError("Не вдалося зберегти зміни профілю");
      setSaving(false);
      return;
    }

    setProfile({
      ...profile,
      shop_name: shopName,
      contact,
      city,
      address,
    });
    setSuccess("Профіль оновлено ✅");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <p className="text-slate-900">Завантаження...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="bg-white shadow-lg rounded-2xl p-6 max-w-md w-full text-center text-slate-900">
          <p className="text-red-600 mb-4">
            {error ?? "Профіль продавця недоступний"}
          </p>
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full text-slate-900">
        <h1 className="text-2xl font-bold mb-6 text-slate-900">
          Мій профіль продавця
        </h1>

        {/* Верхній блок з аватаром */}
        <div className="flex items-center gap-4 mb-6">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-sm">
              Без фото
            </div>
          )}

          <div>
            <p className="font-semibold text-slate-900">
              {profile.shop_name || "Назва магазину не вказана"}
            </p>
            {email && <p className="text-sm text-slate-700">{email}</p>}
            <p className="text-sm text-slate-700">
              {profile.city || "Місто не вказано"}
              {profile.contact && <> · {profile.contact}</>}
            </p>
          </div>
        </div>

        {/* Зміна аватарки */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-slate-900">
            Змінити фото профілю
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
          {uploading && (
            <p className="text-xs text-slate-700 mt-1">Завантаження...</p>
          )}
        </div>

        {/* Форма редагування даних магазину */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900">
              Назва магазину
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-900 placeholder-slate-600
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Наприклад: Квіти біля дому"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900">
              Номер телефону
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-900 placeholder-slate-600
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+380..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900">
              Місто
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-900 placeholder-slate-600
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">Оберіть місто</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-900">
              Адреса
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-900 placeholder-slate-600
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Вулиця, будинок..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-300"
          >
            {saving ? "Збереження..." : "Зберегти зміни профілю"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        {success && <p className="text-emerald-700 text-sm mt-3">{success}</p>}
      </div>
    </div>
  );
}
