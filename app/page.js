import { redirect } from 'next/navigation';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { user } = await getAuthUserAndProfile();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
