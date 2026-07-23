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
        <label className="block text-sm text-neutral-400 mb-1" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-card border border-neutral-700 rounded px-3 py-2 text-base"
        />
      </div>

      <PasswordField
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded px-3 py-2 text-sm font-semibold"
      >
        {isPending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}
