export default function CookiesPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl bg-white px-4 py-10 text-slate-900">
      <h1 className="mb-3 text-3xl font-bold">
        Політика використання cookies
      </h1>

      <p className="mb-6 text-sm text-slate-600">
        Останнє оновлення: 04 січня 2026 року
      </p>

      <section className="space-y-4 text-base leading-relaxed text-slate-800">
        <p>
          Сайт KVITY.INFO використовує файли cookies для забезпечення коректної
          роботи сервісу та покращення користувацького досвіду.
        </p>

        <h2 className="text-lg font-semibold">Що таке cookies?</h2>
        <p>
          Cookies — це невеликі текстові файли, які зберігаються на вашому
          пристрої під час відвідування сайту.
        </p>

        <h2 className="text-lg font-semibold">Які cookies ми використовуємо</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Технічні cookies для коректної роботи сайту</li>
          <li>Аналітичні cookies (Google Analytics)</li>
        </ul>

        <h2 className="text-lg font-semibold">Аналітика</h2>
        <p>
          Ми використовуємо Google Analytics для збору анонімної статистики
          відвідуваності. Ці дані допомагають нам покращувати роботу сервісу.
        </p>

        <h2 className="text-lg font-semibold">Керування cookies</h2>
        <p>
          Ви можете змінити налаштування cookies у своєму браузері або відмовитись
          від аналітичних cookies.
        </p>

        <h2 className="text-lg font-semibold">Контакти</h2>
        <p>
          Якщо у вас є питання, напишіть нам:{" "}
          <strong>flower.work001@gmail.com</strong>
        </p>
      </section>
    </main>
  );
}
