import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
      <h1 className="mb-3 text-3xl font-bold">Умови користування</h1>

      <p className="mb-8 text-sm text-slate-600">
        Останнє оновлення: 04 січня 2026 року
      </p>

      <div className="space-y-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Загальні положення</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Ці Умови користування (далі — «Умови») регулюють використання сайту{" "}
            <span className="font-semibold">KVITY.INFO</span> (далі — «Сайт»).
            Використовуючи Сайт, ви підтверджуєте, що ознайомились та погоджуєтесь
            із цими Умовами.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Що таке KVITY.INFO</h2>
          <p className="text-base leading-relaxed text-slate-800">
            KVITY.INFO — це онлайн-платформа (маркетплейс), яка допомагає
            користувачам знаходити пропозиції квіткових магазинів та залишати
            заявки на замовлення.
          </p>
          <p className="text-base leading-relaxed text-slate-800">
            <span className="font-semibold">KVITY.INFO не є продавцем</span>{" "}
            квітів та не є стороною договору купівлі-продажу між покупцем і
            квітковим магазином, якщо інше прямо не зазначено.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Замовлення та взаємодія</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Коли ви залишаєте заявку/замовлення на Сайті, ваші контактні дані
            можуть бути передані відповідному квітковому магазину для зв’язку та
            виконання замовлення.
          </p>
          <p className="text-base leading-relaxed text-slate-800">
            Умови оплати, доставки, наявності товарів, заміни квітів у букеті та
            інші деталі узгоджуються{" "}
            <span className="font-semibold">безпосередньо між покупцем і магазином</span>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Відповідальність</h2>
          <p className="text-base leading-relaxed text-slate-800">
            KVITY.INFO не несе відповідальності за:
          </p>

          <ul className="list-inside list-disc space-y-2 text-base text-slate-800">
            <li>якість квітів, букетів або інших товарів магазину</li>
            <li>виконання/невиконання замовлення квітковим магазином</li>
            <li>умови оплати та доставки</li>
            <li>неточності в описі товарів або цін, опублікованих продавцем</li>
            <li>дії або бездіяльність третіх сторін</li>
          </ul>

          <p className="text-base leading-relaxed text-slate-800">
            Ми докладаємо зусиль, щоб інформація на Сайті була актуальною, але не
            гарантуємо її повної точності та безперервної роботи Сайту.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Правила для продавців</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Продавці (квіткові магазини), які розміщують товари/оголошення на
            Сайті, зобов’язуються:
          </p>
          <ul className="list-inside list-disc space-y-2 text-base text-slate-800">
            <li>публікувати правдиву інформацію про товари та ціни</li>
            <li>вчасно обробляти заявки від клієнтів</li>
            <li>не порушувати права третіх осіб та законодавство</li>
            <li>не розміщувати заборонений або оманливий контент</li>
          </ul>

          <p className="text-base leading-relaxed text-slate-800">
            KVITY.INFO може тимчасово обмежити доступ продавця або видалити
            контент у разі порушення правил або скарг користувачів.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Інтелектуальна власність</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Дизайн, логотип, тексти та інші матеріали Сайту належать KVITY.INFO
            або використовуються на законних підставах. Заборонено копіювати або
            використовувати матеріали без дозволу, окрім випадків, дозволених
            законом.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Конфіденційність</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Обробка персональних даних здійснюється відповідно до{" "}
            <Link href="/privacy" className="text-pink-600 hover:text-pink-700">
              Політики конфіденційності
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Зміни до умов</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Ми можемо оновлювати ці Умови. Актуальна версія завжди доступна на
            цій сторінці.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Контакти</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Якщо у вас є питання — напишіть нам:
          </p>
          <p className="text-base font-semibold">
            📧{" "}
            <a
              href="mailto:flower.work001@gmail.com"
              className="text-pink-600 hover:text-pink-700"
            >
              flower.work001@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
