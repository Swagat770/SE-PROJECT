'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApprovalsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Track comment input per request ID: { [requestId]: 'comment string' }
  const [comments, setComments] = useState({});
  // Track ongoing review action: { requestId: 'APPROVE' | 'REJECT' }
  const [processingId, setProcessingId] = useState(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/approvals');

      if (res.status === 403 || res.status === 401) {
        // Unauthorized -> redirect to dashboard per specification
        router.push('/dashboard');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load pending approvals');
      }

      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || 'Error loading approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleReview = async (requestId, action) => {
    const comment = comments[requestId] || '';

    if (action === 'REJECT' && !comment.trim()) {
      if (!confirm('Are you sure you want to reject without a comment? Adding a reason is recommended.')) {
        return;
      }
    }

    try {
      setProcessingId(requestId);
      setError('');
      setSuccess('');

      const res = await fetch('/api/approvals/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          comment,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || `Failed to ${action.toLowerCase()} request`);
      }

      setSuccess(`Request successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}!`);

      // Clear the comment for that request
      setComments((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });

      // Refresh list
      await fetchApprovals();
    } catch (err) {
      setError(err.message || 'Error reviewing request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading pending team approvals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-indigo-600">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Pending Approvals</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manager Approvals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and decide on pending leave applications from your direct reports
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
        >
          Refresh List
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start space-x-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800 flex items-start space-x-2">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Pending Direct Report Requests
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {requests.length} Pending
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-800">All caught up!</p>
            <p className="text-sm text-slate-500 mt-1">
              There are no pending leave requests from your team members right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {requests.map((r) => {
              const currentComment = comments[r.id] || '';
              const isBusy = processingId === r.id;

              return (
                <div key={r.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Applicant details and leave details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                          {r.profiles?.name?.charAt(0) || 'U'}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 text-base">
                            {r.profiles?.name || 'Employee'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Department: {r.profiles?.department || 'General'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-400 block uppercase font-medium text-[10px]">
                            Leave Type
                          </span>
                          <span className="font-semibold text-slate-800">
                            {r.leave_types?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-medium text-[10px]">
                            Duration
                          </span>
                          <span className="font-semibold text-slate-800">
                            {r.days} working {r.days === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-medium text-[10px]">
                            Dates
                          </span>
                          <span className="font-semibold text-slate-800">
                            {r.start_date} to {r.end_date}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-medium text-[10px]">
                            Current Remaining
                          </span>
                          <span className={`font-bold ${r.currentRemaining !== null && r.currentRemaining < r.days ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {r.currentRemaining !== null ? `${r.currentRemaining} days` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
                          Reason for Absence
                        </span>
                        <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 italic">
                          "{r.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Right: Review actions and comment box */}
                    <div className="lg:w-80 flex-shrink-0 bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Reviewer Comment
                      </label>
                      <textarea
                        rows={2}
                        value={currentComment}
                        onChange={(e) =>
                          setComments((prev) => ({
                            ...prev,
                            [r.id]: e.target.value,
                          }))
                        }
                        placeholder="Add feedback or approval notes..."
                        disabled={isBusy}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleReview(r.id, 'APPROVE')}
                          disabled={isBusy}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{isBusy ? 'Processing...' : 'Approve'}</span>
                        </button>

                        <button
                          onClick={() => handleReview(r.id, 'REJECT')}
                          disabled={isBusy}
                          className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>{isBusy ? 'Processing...' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
