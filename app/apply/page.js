'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateWorkingDays } from '@/lib/workingDays';

export default function ApplyLeavePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Fetch form dependencies (leave types with user balances and holidays)
  useEffect(() => {
    async function loadFormData() {
      try {
        setLoading(true);
        const res = await fetch('/api/apply/form-data');
        if (!res.ok) throw new Error('Failed to load application form');
        const data = await res.json();
        setLeaveTypes(data.leaveTypes || []);
        setHolidays(data.holidays || []);

        if (data.leaveTypes?.length > 0) {
          setSelectedTypeId(String(data.leaveTypes[0].id));
        }
      } catch (err) {
        setError(err.message || 'Error loading form');
      } finally {
        setLoading(false);
      }
    }
    loadFormData();
  }, []);

  // Compute selected leave type metadata
  const selectedType = useMemo(() => {
    return leaveTypes.find((lt) => String(lt.id) === String(selectedTypeId));
  }, [leaveTypes, selectedTypeId]);

  // Compute working days live in real-time
  const computedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (endDate < startDate) return 0;
    return calculateWorkingDays(startDate, endDate, holidays);
  }, [startDate, endDate, holidays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Pre-flight validation
    if (!selectedTypeId) {
      setError('Please select a leave type');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be earlier than start date');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the leave');
      return;
    }
    if (computedDays <= 0) {
      setError('Selected dates have 0 working days (all selected days are weekends or holidays)');
      return;
    }
    if (selectedType && computedDays > selectedType.remaining) {
      setError(
        `Insufficient balance: Requested ${computedDays} days, but only ${selectedType.remaining} days remaining.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/requests/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveTypeId: selectedTypeId,
          startDate,
          endDate,
          reason,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit leave request');
      }

      setSuccess('Leave request submitted successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading leave application form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-indigo-600">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Apply Leave</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Apply for Leave
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Submit your leave application for manager review
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800 flex items-start space-x-2">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="leaveType">
                Leave Type
              </label>
              <select
                id="leaveType"
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
              >
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} Leave ({lt.remaining} remaining of {lt.yearly_quota})
                  </option>
                ))}
              </select>
              {selectedType && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Available balance:{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedType.remaining} days
                  </span>{' '}
                  (Annual quota: {selectedType.yearly_quota} days)
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="startDate">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="endDate">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  required
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* Live Computed Working Days Banner */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-indigo-700">
                  Computed Working Days
                </div>
                <div className="text-xs text-indigo-600/80 mt-0.5">
                  Excludes Saturdays, Sundays, and public holidays
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-900">
                {computedDays}{' '}
                <span className="text-xs font-normal text-indigo-700">
                  {computedDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="reason">
                Reason for Leave
              </label>
              <textarea
                id="reason"
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason for your absence..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || (selectedType && computedDays > selectedType.remaining)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info: Rules & Upcoming Holidays */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
              Application Rules
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>End date must be on or after start date.</li>
              <li>Only Monday to Friday count as working days.</li>
              <li>Official company holidays are automatically deducted.</li>
              <li>Requests cannot overlap existing Pending or Approved leaves.</li>
              <li>Manager approval is required before balance deduction.</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
              Company Holidays
            </h3>
            {holidays.length === 0 ? (
              <p className="text-xs text-slate-400">No holidays listed</p>
            ) : (
              <div className="space-y-2.5">
                {holidays.map((h) => (
                  <div
                    key={h.id || h.date}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium text-slate-800">{h.name}</span>
                    <span className="text-slate-500 font-mono">{h.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
