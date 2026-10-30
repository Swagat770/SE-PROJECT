import { NextResponse } from 'next/server';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user } = await getAuthUserAndProfile();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Check that request exists, belongs to user, and is PENDING
    const { data: leaveReq, error: fetchError } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !leaveReq) {
      return NextResponse.json(
        { error: 'Leave request not found or does not belong to you' },
        { status: 404 }
      );
    }

    if (leaveReq.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel a request that is already ${leaveReq.status}` },
        { status: 400 }
      );
    }

    // Update status to CANCELLED
    const { error: updateError } = await supabaseAdmin
      .from('leave_requests')
      .update({ status: 'CANCELLED' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Leave request cancelled successfully' });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to cancel request' },
      { status: 500 }
    );
  }
}
