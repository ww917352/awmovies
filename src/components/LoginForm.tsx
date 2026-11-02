'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import PasswordField from './PasswordField';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Login failed');
        return;
      }
      router.push(data.mustChangePassword ? '/change-password' : '/');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-[13px] text-label-2 mb-1 px-1" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl bg-card px-3.5 py-2.5 text-[17px] text-label outline-none ring-1 ring-sep focus:ring-2 focus:ring-tint"
        />
      </div>

      <PasswordField
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

      {error && <p className="text-[14px] text-red-600 dark:text-red-400 px-1">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-tint px-3 py-3 text-[17px] font-semibold text-white disabled:opacity-50 dark:text-black"
      >
        {isPending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}
