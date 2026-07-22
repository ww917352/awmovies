import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? '/change-password' : '/');

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Log in</h1>
      <LoginForm />
      <p className="text-sm text-neutral-500 mt-6">
        You can browse the catalog without logging in — logging in lets you track watched/owned status.
      </p>
    </main>
  );
}
