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

    // Base query for approved leave requests
    let query = supabaseAdmin
      .from('leave_requests')
      .select(`
        id,
        start_date,
        end_date,
        days,
        reason,
        status,
        profiles!leave_requests_user_id_fkey!inner (id, name, department),
        leave_types (name)
      `)
      .eq('status', 'APPROVED')
      .order('start_date', { ascending: true });

    // Employees only see approved leaves in their own department
    if (profile.role === 'employee' && profile.department) {
      query = query.eq('profiles.department', profile.department);
    }

    const { data: leaves, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      role: profile.role,
      department: profile.department,
      leaves: leaves || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch team leaves' },
      { status: 500 }
    );
  }
}
