import { redirect } from 'next/navigation';
import { getUserSettings, getYearRange } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// The Awards tab opens on the pinned year, or the latest one.
export default async function AwardsIndexPage() {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const [{ pinnedYear }, { maxYear }] = await Promise.all([getUserSettings(user?.id ?? null), getYearRange()]);
  redirect(`/awards/${pinnedYear ?? maxYear}`);
}
