import { NextResponse } from 'next/server';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { calculateWorkingDays } from '@/lib/workingDays';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user } = await getAuthUserAndProfile();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaveTypeId, startDate, endDate, reason } = await request.json();

    // Rule 1: Field presence and basic format
    if (!leaveTypeId) {
      return NextResponse.json({ error: 'Please select a leave type' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'A reason for your leave request is required' }, { status: 400 });
    }

    // Rule 2: End date >= Start date
    if (endDate < startDate) {
      return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 });
    }

    // Rule 3: Compute working days (Mon-Fri excluding holidays)
    const { data: holidays, error: hError } = await supabaseAdmin
      .from('holidays')
      .select('date');

    if (hError) throw hError;

    const days = calculateWorkingDays(startDate, endDate, holidays || []);

    // Rule 4: Days must be > 0
    if (days <= 0) {
      return NextResponse.json(
        { error: 'Selected date range contains 0 working days (dates fall entirely on weekends or public holidays)' },
        { status: 400 }
      );
    }

    // Rule 5: Reject if days > remaining balance for that type
    const { data: balanceRow } = await supabaseAdmin
      .from('leave_balances')
      .select('remaining')
      .eq('user_id', user.id)
      .eq('leave_type_id', leaveTypeId)
      .maybeSingle();

    let remainingBalance = 0;

    if (balanceRow) {
      remainingBalance = Number(balanceRow.remaining);
    } else {
      // Fallback to yearly quota if balance record not yet inserted
      const { data: lt } = await supabaseAdmin
        .from('leave_types')
        .select('yearly_quota')
        .eq('id', leaveTypeId)
        .single();
      remainingBalance = lt ? Number(lt.yearly_quota) : 0;
    }

    if (days > remainingBalance) {
      return NextResponse.json(
        {
          error: `Insufficient leave balance: You requested ${days} day(s), but you only have ${remainingBalance} day(s) remaining for this leave type.`,
        },
        { status: 400 }
      );
    }

    // Rule 6: Overlap check: reject if dates overlap an existing PENDING or APPROVED request of the same user
    // Two intervals [s1, e1] and [s2, e2] overlap if s1 <= e2 AND e1 >= s2
    const { data: overlappingRequests, error: overlapError } = await supabaseAdmin
      .from('leave_requests')
      .select('id, start_date, end_date, status')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'APPROVED'])
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    if (overlapError) throw overlapError;

    if (overlappingRequests && overlappingRequests.length > 0) {
      const conflict = overlappingRequests[0];
      return NextResponse.json(
        {
          error: `Overlap conflict: You already have a ${conflict.status} leave request from ${conflict.start_date} to ${conflict.end_date} that overlaps with your selected dates.`,
        },
        { status: 400 }
      );
    }

    // Insert request with status 'PENDING'
    const { data: newRequest, error: insertError } = await supabaseAdmin
      .from('leave_requests')
      .insert({
        user_id: user.id,
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        days: days,
        reason: reason.trim(),
        status: 'PENDING',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully',
      request: newRequest,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to submit leave request' },
      { status: 500 }
    );
  }
}
