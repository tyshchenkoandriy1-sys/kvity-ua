'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage('❌ Помилка входу: ' + error.message);
      return;
    }

    // Якщо успішно
    setMessage('✅ Успішний вхід!');

    // Перекидаємо на головну (там потім буде кабінет / каталог)
    window.location.href = '/dashboard';
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center">
          Вхід для квіткових магазинів
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="shop@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Пароль
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Входимо...' : 'Увійти'}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm text-slate-700 whitespace-pre-line">
            {message}
          </p>
        )}

        <p className="text-xs text-center text-slate-500">
          Якщо ви ще не маєте акаунта, спочатку{' '}
          <a href="/register" className="text-blue-600 underline">
            зареєструйте магазин
          </a>
          .
        </p>
      </div>
    </main>
  );
}
