import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';
import AuthFrame from '@/components/AuthFrame';
import TmdbAttribution from '@/components/TmdbAttribution';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? '/change-password' : '/');

  return (
    <AuthFrame>
      <div className="mb-4 rounded-2xl bg-tint-soft px-4 py-3 text-center">
        <p className="text-[15px] font-semibold text-tint">Invite only</p>
        <p className="mt-0.5 text-[14px] text-label-2">
          Accounts are by invitation; there’s no sign-up. If you’ve been invited, log in with the username and password
          you were given.
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-[15px] text-label-2">
        No invitation?{' '}
        <Link href="/" className="text-tint hover:underline">
          Browse the catalog
        </Link>{' '}
        without logging in.
      </p>
      <TmdbAttribution className="mt-8 text-center" />
    </AuthFrame>
  );
}
