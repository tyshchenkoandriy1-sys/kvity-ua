// app/partner/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function PartnerPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl bg-white shadow-lg border border-slate-200 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Стати партнером kvity.ua
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Якщо у вас є квітковий магазин — створіть кабінет продавця або
          увійдіть у вже існуючий акаунт.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => router.push("/register")}
            className="w-full rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600"
          >
            Я новий продавець — зареєструватись
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            У мене вже є акаунт — увійти
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-600">
          Після підтвердження вашого магазину адміністратором ви отримаєте
          доступ до кабінету продавця, статистики та управління оголошеннями.
        </p>
      </div>
    </main>
  );
}
