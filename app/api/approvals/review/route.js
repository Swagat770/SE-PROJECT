import { NextResponse } from 'next/server';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user, profile } = await getAuthUserAndProfile();

    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'manager' && profile.role !== 'hr') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can review leave requests' },
        { status: 403 }
      );
    }

    const { requestId, action, comment } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action (APPROVE or REJECT) are required' },
        { status: 400 }
      );
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json(
        { error: 'Action must be either APPROVE or REJECT' },
        { status: 400 }
      );
    }

    // 1. Fetch the leave request
    const { data: leaveReq, error: reqError } = await supabaseAdmin
      .from('leave_requests')
      .select('*, profiles!leave_requests_user_id_fkey (id, name, manager_id)')
      .eq('id', requestId)
      .single();

    if (reqError || !leaveReq) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveReq.status !== 'PENDING') {
      return NextResponse.json(
        { error: `This request is already ${leaveReq.status}` },
        { status: 400 }
      );
    }

    // 2. Authorization check: manager can only review direct reports (HR can review all)
    const isDirectManager = leaveReq.profiles?.manager_id === profile.id;
    const isHr = profile.role === 'hr';

    if (!isDirectManager && !isHr) {
      return NextResponse.json(
        { error: 'Forbidden: You can only review requests from your direct reports' },
        { status: 403 }
      );
    }

    // 3. Handle APPROVE: Deduct days from leave_balances.remaining and update request
    if (action === 'APPROVE') {
      // Fetch applicant's current balance
      const { data: balanceRow } = await supabaseAdmin
        .from('leave_balances')
        .select('remaining')
        .eq('user_id', leaveReq.user_id)
        .eq('leave_type_id', leaveReq.leave_type_id)
        .maybeSingle();

      let currentRemaining = 0;
      if (balanceRow) {
        currentRemaining = Number(balanceRow.remaining);
      } else {
        const { data: lt } = await supabaseAdmin
          .from('leave_types')
          .select('yearly_quota')
          .eq('id', leaveReq.leave_type_id)
          .single();
        currentRemaining = lt ? Number(lt.yearly_quota) : 0;
      }

      const daysToDeduct = Number(leaveReq.days);
      const newRemaining = Math.max(0, currentRemaining - daysToDeduct);

      // Upsert updated remaining balance
      const { error: balanceUpdateError } = await supabaseAdmin
        .from('leave_balances')
        .upsert(
          {
            user_id: leaveReq.user_id,
            leave_type_id: leaveReq.leave_type_id,
            remaining: newRemaining,
          },
          { onConflict: 'user_id,leave_type_id' }
        );

      if (balanceUpdateError) throw balanceUpdateError;

      // Update request status to APPROVED
      const { error: updateError } = await supabaseAdmin
        .from('leave_requests')
        .update({
          status: 'APPROVED',
          reviewer_id: profile.id,
          reviewer_comment: comment ? comment.trim() : null,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Leave request approved and balance deducted successfully',
        newRemaining,
      });
    }

    // 4. Handle REJECT: update status and notes without deducting days
    if (action === 'REJECT') {
      const { error: updateError } = await supabaseAdmin
        .from('leave_requests')
        .update({
          status: 'REJECTED',
          reviewer_id: profile.id,
          reviewer_comment: comment ? comment.trim() : null,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Leave request rejected',
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to review leave request' },
      { status: 500 }
    );
  }
}
