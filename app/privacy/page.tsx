export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl bg-white px-4 py-10 text-slate-900">

      <h1 className="mb-3 text-3xl font-bold">Політика конфіденційності</h1>

      <p className="mb-8 text-sm text-slate-600">
        Останнє оновлення: 04 січня 2026 року
      </p>

      <div className="space-y-10">
        {/* 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Загальні положення</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Сайт <span className="font-semibold">KVITY.INFO</span> поважає право
            користувачів на конфіденційність та захист персональних даних.
          </p>
          <p className="text-base leading-relaxed text-slate-800">
            Ця Політика конфіденційності пояснює, які дані ми збираємо, як їх
            використовуємо та як захищаємо.
          </p>
          <p className="text-base leading-relaxed text-slate-800">
            Користуючись Сайтом, ви погоджуєтесь з умовами цієї Політики.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Які дані ми збираємо</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Ми можемо збирати такі дані:
          </p>

          <ul className="list-inside list-disc space-y-2 text-base text-slate-800">
            <li>ім’я (якщо вказується у формі)</li>
            <li>номер телефону</li>
            <li>електронну пошту</li>
            <li>місто та іншу інформацію, введену у формах</li>
            <li>технічні дані: IP-адреса, тип браузера, пристрій</li>
            <li>дані про взаємодію з сайтом (через Google Analytics)</li>
          </ul>
        </section>

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Як ми використовуємо дані</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Зібрані дані використовуються для:
          </p>

          <ul className="list-inside list-disc space-y-2 text-base text-slate-800">
            <li>обробки заявок та замовлень</li>
            <li>зв’язку між покупцем і квітковим магазином</li>
            <li>покращення роботи Сайту</li>
            <li>аналітики та статистики</li>
            <li>забезпечення безпеки</li>
          </ul>
        </section>

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Аналітика та cookies</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Сайт використовує <span className="font-semibold">Google Analytics</span>{" "}
            для аналізу відвідуваності та поведінки користувачів.
          </p>
          <p className="text-base leading-relaxed text-slate-800">
            Google Analytics може використовувати cookies та збирати анонімну
            інформацію.
          </p>
          <p className="text-base leading-relaxed text-slate-800">
            Ви можете відключити cookies у налаштуваннях браузера.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            5. Передача даних третім сторонам
          </h2>
          <p className="text-base leading-relaxed text-slate-800">
            Ми не продаємо і не передаємо персональні дані третім особам, окрім
            випадків:
          </p>

          <ul className="list-inside list-disc space-y-2 text-base text-slate-800">
            <li>передачі даних квітковим магазинам для обробки замовлення</li>
            <li>вимог законодавства</li>
            <li>
              використання сервісів хостингу та аналітики (Supabase, Google)
            </li>
          </ul>
        </section>

        {/* 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Захист даних</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Ми використовуємо технічні та організаційні заходи для захисту
            персональних даних від втрати, несанкціонованого доступу або
            розголошення.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Права користувача</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Користувач має право:
          </p>

          <ul className="list-inside list-disc space-y-2 text-base text-slate-800">
            <li>отримати інформацію про свої персональні дані</li>
            <li>вимагати виправлення або видалення даних</li>
            <li>відкликати згоду на обробку даних</li>
          </ul>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-base text-slate-800">
              Для цього звертайтесь на email:
            </p>
            <p className="mt-2 text-base font-semibold">
              📧{" "}
              <a
                href="mailto:flower.work001@gmail.com"
                className="text-pink-600 hover:text-pink-700"
              >
                flower.work001@gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Зміни до політики</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Ми можемо оновлювати цю Політику. Актуальна версія завжди доступна
            на цій сторінці.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Контакти</h2>
          <p className="text-base leading-relaxed text-slate-800">
            Якщо у вас є питання щодо конфіденційності, зв’яжіться з нами:
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
