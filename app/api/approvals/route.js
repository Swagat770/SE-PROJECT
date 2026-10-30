import { NextResponse } from 'next/server';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, profile } = await getAuthUserAndProfile();

    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'manager' && profile.role !== 'hr') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can view team approvals' },
        { status: 403 }
      );
    }

    // 1. Get IDs of direct reports (profiles where manager_id = current manager id)
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('manager_id', profile.id);

    if (reportsError) throw reportsError;

    const reportIds = (reports || []).map((r) => r.id);

    if (reportIds.length === 0) {
      return NextResponse.json({ requests: [], isManager: true });
    }

    // 2. Fetch pending requests from direct reports
    const { data: requests, error: reqError } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        id,
        user_id,
        leave_type_id,
        start_date,
        end_date,
        days,
        reason,
        status,
        created_at,
        profiles!leave_requests_user_id_fkey (id, name, department),
        leave_types (id, name)
      `)
      .in('user_id', reportIds)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (reqError) throw reqError;

    // 3. For each request, fetch the applicant's current remaining balance for that leave type
    // so the manager can see applicant's current balance before approving
    const applicantBalances = await Promise.all(
      (requests || []).map(async (r) => {
        const { data: bal } = await supabaseAdmin
          .from('leave_balances')
          .select('remaining')
          .eq('user_id', r.user_id)
          .eq('leave_type_id', r.leave_type_id)
          .maybeSingle();

        return {
          ...r,
          currentRemaining: bal ? Number(bal.remaining) : null,
        };
      })
    );

    return NextResponse.json({
      requests: applicantBalances,
      manager: profile,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch approval requests' },
      { status: 500 }
    );
  }
}
