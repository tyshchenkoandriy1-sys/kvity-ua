// app/about/page.tsx
"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Заголовок */}
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Про KVITY.INFO 🌸
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-700">
             Ми маркетплейс локальних квіткових магазинів, який
            допомагає людям швидко знаходити живі квіти поруч із собою та за найкращими цінами.
          </p>
        </header>

        {/* Хто ми */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold">Хто ми</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            KVITY.INFO створений як сучасний онлайн-сервіс для квіткових
            магазинів і покупців. Ми віримо, що купівля квітів має бути простою,
            швидкою та чесною — без десятків дзвінків і нескінченних переписок.
          </p>
        </section>

        {/* Навіщо */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold">Навіщо існує kvity.info</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Допомогти покупцям знаходити квіти у своєму місті</li>
            <li>Дати магазинам простий онлайн-інструмент без власного сайту</li>
            <li>Зробити ринок квітів більш прозорим і зручним</li>
          </ul>
        </section>

        {/* Для кого */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold">Для кого цей сервіс</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold">Для покупців</h3>
              <p className="text-sm text-slate-700">
                Знаходь квіти поруч, порівнюй ціни, обирай за фото та залишай
                замовлення без реєстрації.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold">Для магазинів</h3>
              <p className="text-sm text-slate-700">
                Отримуй нових клієнтів, керуй товарами та замовленнями через
                простий кабінет продавця.
              </p>
            </div>
          </div>
        </section>

        {/* Як працює */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold">Як це працює</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Магазин реєструється та додає свої товари</li>
            <li>Ми підтверджуємо магазин</li>
            <li>Покупці бачать актуальні оголошення</li>
            <li>Замовлення передається напряму магазину</li>
          </ol>
        </section>

        {/* Довіра */}
        <section className="mb-12">
          <h2 className="mb-3 text-xl font-bold">Чому нам можна довіряти</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Ми показуємо тільки активні та оновлені оголошення</li>
            <li>Магазини проходять модерацію</li>
            <li>Ніяких прихованих комісій для покупців</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-slate-900 p-6 text-center text-white">
          <h2 className="mb-2 text-xl font-bold">
            Хочеш приєднатися до KVITY.INFO?
          </h2>
          <p className="mb-4 text-sm text-slate-200">
            Якщо ти квітковий магазин — додай свій бізнес до нашої платформи.
          </p>
          <Link
            href="/partner"
            className="inline-flex rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
          >
            Стати партнером
          </Link>
        </section>
      </div>
    </main>
  );
}
