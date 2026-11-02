import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import AuthFrame from '@/components/AuthFrame';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AuthFrame>
      <h1 className="title-2 mb-4 text-center">Change password</h1>
      <ChangePasswordForm forced={user.mustChangePassword} />
    </AuthFrame>
  );
}
