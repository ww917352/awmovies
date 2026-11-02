import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import AppNavWithBack, { AppNav } from '@/components/AppNav';

// The tabbed part of the app. Login and change-password live outside this
// group, so they get a bare page with no nav.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const navUser = user ? { username: user.username } : null;

  return (
    <div className="shell">
      {/* The live nav reads ?back= on film pages; the fallback is the same nav without it. */}
      <Suspense fallback={<AppNav user={navUser} />}>
        <AppNavWithBack user={navUser} />
      </Suspense>
      <main className="app-main">{children}</main>
    </div>
  );
}
