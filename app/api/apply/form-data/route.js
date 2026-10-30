import { NextResponse } from 'next/server';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, profile } = await getAuthUserAndProfile();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch leave types
    const { data: leaveTypes, error: ltError } = await supabaseAdmin
      .from('leave_types')
      .select('*')
      .order('id', { ascending: true });

    if (ltError) throw ltError;

    // 2. Fetch user's leave balances
    const { data: balances, error: balError } = await supabaseAdmin
      .from('leave_balances')
      .select('*')
      .eq('user_id', user.id);

    if (balError) throw balError;

    const balanceMap = {};
    for (const b of balances || []) {
      balanceMap[b.leave_type_id] = Number(b.remaining);
    }

    const typesWithBalances = (leaveTypes || []).map((lt) => ({
      ...lt,
      remaining: balanceMap[lt.id] !== undefined ? balanceMap[lt.id] : lt.yearly_quota,
    }));

    // 3. Fetch all holidays
    const { data: holidays, error: hError } = await supabaseAdmin
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (hError) throw hError;

    return NextResponse.json({
      user,
      profile,
      leaveTypes: typesWithBalances,
      holidays: holidays || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to load form data' },
      { status: 500 }
    );
  }
}
