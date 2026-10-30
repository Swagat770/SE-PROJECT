import { NextResponse } from 'next/server';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, profile } = await getAuthUserAndProfile();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user,
      profile,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Error checking session' },
      { status: 500 }
    );
  }
}
