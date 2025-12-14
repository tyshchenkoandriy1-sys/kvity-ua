"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const CITIES = ["Київ", "Львів", "Івано-Франківськ"];

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [city, setCity] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState(""); // 👈 НОВЕ

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || !shopName || !city || !contact || !address) {
      setError("Заповніть всі поля");
      return;
    }

    setLoading(true);

    // На всяк випадок розлогінимось
    await supabase.auth.signOut();

    // 1) Створюємо користувача в Auth
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

    if (signUpError) {
      setError("Не вдалося створити користувача: " + signUpError.message);
      setLoading(false);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      setError("Користувача створено, але немає user.id");
      setLoading(false);
      return;
    }

    // 2) Створюємо профіль у public.profiles з адресою
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      role: "pending",
      shop_name: shopName,
      city,
      contact,
      address, // 👈 ЗБЕРІГАЄМО АДРЕСУ
    });

    if (profileError) {
      setError(
        "⚠️ Користувача створено, але профіль не збережений: " +
          profileError.message
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    setSuccess("Магазин зареєстровано! Тепер увійдіть під цим email 🌸");
    setLoading(false);

    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Реєстрація магазину</h1>

        {error && (
          <p className="mb-3 text-sm text-red-500 whitespace-pre-line">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-3 text-sm text-emerald-600 whitespace-pre-line">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="Назва магазину"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />

          <select
  className="w-full border rounded-lg px-3 py-2 bg-white"
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


          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="Контакт (телеграм/телефон)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm
             text-slate-800 placeholder-slate-500
             outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            placeholder="Адреса (вулиця, будинок)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:bg-slate-400"
          >
            {loading ? "Реєстрація..." : "Зареєструвати магазин"}
          </button>
        </form>
      </div>
    </div>
  );
}
