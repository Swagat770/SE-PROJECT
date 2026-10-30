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

    // 1. Fetch all leave types
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

    // Create a map of balances by leave_type_id
    const balanceMap = {};
    for (const b of balances || []) {
      balanceMap[b.leave_type_id] = Number(b.remaining);
    }

    // Combine leave types with remaining balances
    const balanceCards = (leaveTypes || []).map((lt) => ({
      id: lt.id,
      name: lt.name,
      yearly_quota: lt.yearly_quota,
      remaining: balanceMap[lt.id] !== undefined ? balanceMap[lt.id] : lt.yearly_quota,
    }));

    // 3. Fetch user's own leave requests
    const { data: requests, error: reqError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        id,
        leave_type_id,
        start_date,
        end_date,
        days,
        reason,
        status,
        reviewer_id,
        reviewer_comment,
        created_at,
        leave_types (id, name),
        reviewer:profiles!leave_requests_reviewer_id_fkey (name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (reqError) throw reqError;

    return NextResponse.json({
      user,
      profile,
      balances: balanceCards,
      requests: requests || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
