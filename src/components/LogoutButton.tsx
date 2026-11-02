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
      className={`w-full rounded-2xl bg-card px-4 py-3 text-[17px] text-red-600 hover:bg-card-2 dark:text-red-400 ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      Log out
    </button>
  );
}
