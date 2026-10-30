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

    if (profile.role !== 'hr') {
      return NextResponse.json(
        { error: 'Forbidden: HR access required' },
        { status: 403 }
      );
    }

    // 1. Fetch all requests with profile and leave type information
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
        reviewer_id,
        reviewer_comment,
        created_at,
        profiles!leave_requests_user_id_fkey (id, name, department),
        leave_types (id, name),
        reviewer:profiles!leave_requests_reviewer_id_fkey (name)
      `)
      .order('created_at', { ascending: false });

    if (reqError) throw reqError;

    // 2. Fetch distinct departments
    const { data: profilesList } = await supabaseAdmin
      .from('profiles')
      .select('department');

    const departmentSet = new Set();
    for (const p of profilesList || []) {
      if (p.department) departmentSet.add(p.department);
    }
    const departments = Array.from(departmentSet).sort();

    // 3. Compute Summary Statistics for APPROVED requests:
    // a) Leave days taken per department
    const deptTotals = {};
    for (const d of departments) {
      deptTotals[d] = 0;
    }

    // b) Leave days taken per month (e.g. YYYY-MM)
    const monthTotals = {};

    for (const r of requests || []) {
      if (r.status === 'APPROVED') {
        const days = Number(r.days);
        const dept = r.profiles?.department || 'Unassigned';
        deptTotals[dept] = (deptTotals[dept] || 0) + days;

        const monthKey = String(r.start_date).slice(0, 7); // e.g. "2026-10"
        monthTotals[monthKey] = (monthTotals[monthKey] || 0) + days;
      }
    }

    const departmentSummary = Object.entries(deptTotals).map(([department, days]) => ({
      department,
      days,
    }));

    const monthSummary = Object.entries(monthTotals)
      .map(([month, days]) => ({
        month,
        days,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      requests: requests || [],
      departments,
      departmentSummary,
      monthSummary,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch HR data' },
      { status: 500 }
    );
  }
}
