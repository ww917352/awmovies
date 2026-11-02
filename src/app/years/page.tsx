import { redirect } from 'next/navigation';

// The old year index; the Awards tab's year picker replaced it.
export default function YearsPage() {
  redirect('/awards');
}
