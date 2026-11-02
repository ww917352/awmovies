'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PASSWORD_REQUIREMENTS } from '@/lib/password-policy';
import PasswordField from './PasswordField';

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unmetRequirements = useMemo(
    () => PASSWORD_REQUIREMENTS.filter((r) => !r.test(newPassword)),
    [newPassword]
  );
  const isStrongEnough = newPassword.length > 0 && unmetRequirements.length === 0;
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not change password');
        return;
      }
      router.push('/');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {forced && (
        <p className="rounded-xl bg-tint-soft px-4 py-3 text-[14px] text-tint">
          You&apos;re using a temporary password. Choose a new one to continue.
        </p>
      )}

      <PasswordField
        id="currentPassword"
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
      />

      <div>
        <PasswordField
          id="newPassword"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <ul className="mt-2 space-y-0.5 px-1 text-[13px]">
          {PASSWORD_REQUIREMENTS.map((req) => {
            const met = req.test(newPassword);
            return (
              <li key={req.id} className={met ? 'text-ok' : 'text-label-2'}>
                {met ? '✓' : '·'} {req.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        {confirmPassword.length > 0 && (
          <p className={`mt-1 px-1 text-[13px] ${passwordsMatch ? 'text-ok' : 'text-red-600 dark:text-red-400'}`}>
            {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}
      </div>

      {error && <p className="text-[14px] text-red-600 dark:text-red-400 px-1">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !isStrongEnough || !passwordsMatch}
        className="w-full rounded-xl bg-tint px-3 py-3 text-[17px] font-semibold text-white disabled:opacity-50 dark:text-black"
      >
        {isPending ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
