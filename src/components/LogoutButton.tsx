'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    });
  }

  return (
    <button
      onClick={logout}
      disabled={isPending}
      className={`rounded-full border border-neutral-300 dark:border-neutral-700 bg-card/90 px-4 py-2 text-sm font-semibold hover:border-neutral-400 dark:hover:border-neutral-500 ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      Log out
    </button>
  );
}
