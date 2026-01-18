import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="KVITY.INFO"
              className="h-8 w-8 rounded-md"
            />
            <span className="font-semibold tracking-tight">KVITY.INFO</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-neutral-700 md:flex">
            <span>Каталог</span>
            <span>Букети</span>
            <span>Про сервіс</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* HERO */}
        <section className="py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Ми відкриваємось скоро
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Квіти поруч з тобою —{" "}
            <span className="text-neutral-600">у новому форматі</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-700 md:text-lg">
            KVITY.INFO — маркетплейс локальних квіткових магазинів. Скоро ти
            зможеш знаходити живі букети поруч із собою, обирати за фото,
            ціною та відстанню — без зайвих дзвінків.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="https://t.me/kvityinfo"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Написати в Telegram
            </a>

            <a
              href="mailto:flower.work001@gmail.com"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Написати на Email
            </a>
          </div>
        </section>

        {/* INSTAGRAM BLOCK */}
        <section className="mb-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                Не пропусти відкриття 🚀
              </h2>
              <p className="mt-2 text-neutral-700 leading-relaxed">
                Підпишись на наш Instagram, щоб першим дізнатись про запуск
                сайту, нові букети та спеціальні пропозиції від квіткових
                магазинів.
              </p>
            </div>

            <a
              href="https://instagram.com/kvity.info"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-neutral-900 ring-1 ring-neutral-200 hover:bg-neutral-100 md:w-auto"
            >
              Перейти в Instagram →
            </a>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mb-16 grid gap-4 md:grid-cols-3">
          <Feature
            title="Локальні магазини"
            text="Тільки реальні квіткові магазини з твого міста."
          />
          <Feature
            title="Живі фото"
            text="Без стоків — тільки справжні букети та композиції."
          />
          <Feature
            title="Просте замовлення"
            text="Мінімум дій — швидкий контакт з флористом."
          />
        </section>

        {/* FOOTER */}
        <footer className="border-t border-neutral-100 py-10 text-sm text-neutral-600">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between">
            <div>
              <div className="font-semibold text-neutral-900">KVITY.INFO</div>
              <p className="mt-2 max-w-md">
                Маркетплейс квіткових магазинів. Запуск — дуже скоро 🌸
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-neutral-900">Контакти</div>
              <a href="mailto:flower.work001@gmail.com">
                flower.work001@gmail.com
              </a>
              <a
                href="https://t.me/kvityinfo"
                target="_blank"
                rel="noreferrer"
              >
                Telegram
              </a>
            </div>
          </div>

          <div className="mt-8 text-xs text-neutral-500">
            © {new Date().getFullYear()} KVITY.INFO
          </div>
        </footer>
      </main>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      <p className="mt-1 text-sm text-neutral-700 leading-relaxed">{text}</p>
    </div>
  );
}
