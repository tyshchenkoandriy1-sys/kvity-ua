"use client";

import { useState } from "react";

export default function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);



  async function submit() {
  setLoading(true);
  setError(null);

  console.log("REVIEW_PAYLOAD", { token, rating, comment });

  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, rating: Number(rating), comment }),
  });

  const data = await res.json().catch(() => ({}));

  console.log("REVIEW_RESPONSE", res.status, data);

  setLoading(false);

  if (!res.ok) {
    setError(`${res.status}: ${data?.error || "Unknown error"}`);
    return;
  }

  setDone(true);
}


  if (done) {
    return (
      <div>
        <div className="text-lg font-medium">Дякуємо! 💛</div>
        <p className="mt-2 text-sm text-gray-600">
          Ваш відгук збережено. Це допомагає іншим обирати продавців.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium">Оцінка</div>
        <div className="mt-2 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRating(v)}
              className={`text-2xl ${v <= rating ? "" : "opacity-30"}`}
              aria-label={`${v} з 5`}
            >
              ⭐
            </button>
          ))}
          <span className="text-sm text-gray-600">{rating}/5</span>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium">Коментар (необовʼязково)</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Наприклад: швидко відповіли, гарні квіти…"
          className="mt-2 w-full rounded-xl border p-3 text-sm"
          rows={4}
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Надсилаю…" : "Надіслати відгук"}
      </button>
    </div>
  );
}
