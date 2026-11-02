import Link from 'next/link';
import Logo from './Logo';

// The bare, centred page login and change-password use (no tab bar).
export default function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-8 flex flex-col items-center gap-2" aria-label="Palmarès home">
        <Logo idPrefix="auth-logo" className="h-28 w-28" />
        <span className="text-[28px] font-bold tracking-tight">Palmarès</span>
        <span className="text-[15px] text-label-2">Oscar · Cannes · Venice · Berlin</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
