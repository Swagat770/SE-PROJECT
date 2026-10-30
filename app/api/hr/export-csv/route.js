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
        { error: 'Forbidden: Only HR can export records' },
        { status: 403 }
      );
    }

    const { data: requests, error } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        id,
        start_date,
        end_date,
        days,
        reason,
        status,
        reviewer_comment,
        created_at,
        profiles!leave_requests_user_id_fkey (name, department),
        leave_types (name),
        reviewer:profiles!leave_requests_reviewer_id_fkey (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Helper to safely escape CSV cells
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Request ID',
      'Employee Name',
      'Department',
      'Leave Type',
      'Start Date',
      'End Date',
      'Working Days',
      'Status',
      'Reason',
      'Reviewer',
      'Reviewer Comment',
      'Applied At',
    ];

    const rows = (requests || []).map((r) => [
      r.id,
      r.profiles?.name || 'N/A',
      r.profiles?.department || 'N/A',
      r.leave_types?.name || 'N/A',
      r.start_date,
      r.end_date,
      r.days,
      r.status,
      r.reason || '',
      r.reviewer?.name || '',
      r.reviewer_comment || '',
      r.created_at ? new Date(r.created_at).toISOString() : '',
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="elms-leave-records.csv"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
