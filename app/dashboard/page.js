'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState({ balances: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancel = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this pending leave request?')) {
      return;
    }

    try {
      setCancellingId(requestId);
      const res = await fetch('/api/requests/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || 'Failed to cancel request');
        return;
      }

      // Refresh data
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Error cancelling request');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
      CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center my-8">
        <h3 className="text-base font-semibold text-red-800 mb-1">Failed to Load Dashboard</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {data.profile?.name || 'Employee'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your leave quotas and manage your applications
          </p>
        </div>
        <Link
          href="/apply"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Apply for Leave
        </Link>
      </div>

      {/* Balance Cards */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Leave Balances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.balances.map((b) => {
            const pct = Math.round((Number(b.remaining) / b.yearly_quota) * 100);
            return (
              <div
                key={b.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{b.name} Leave</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                    Quota: {b.yearly_quota}d
                  </span>
                </div>
                <div className="mt-4 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {b.remaining}
                  </span>
                  <span className="text-sm text-slate-500">
                    / {b.yearly_quota} days left
                  </span>
                </div>
                {/* Visual Progress bar */}
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      pct > 50
                        ? 'bg-emerald-500'
                        : pct > 20
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Your Leave Requests</h2>
          <span className="text-xs text-slate-500 font-medium">
            Total: {data.requests.length} requests
          </span>
        </div>

        {data.requests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg
              className="mx-auto h-10 w-10 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-slate-600">No requests yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Apply for leave using the button above to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Working Days</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reviewer Notes</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {r.leave_types?.name || 'Leave'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {r.start_date} <span className="text-slate-400 font-normal">to</span> {r.end_date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap font-semibold">
                      {r.days} {r.days === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={r.reason}>
                      {r.reason || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                      {r.reviewer_comment ? (
                        <div>
                          <span className="font-medium text-slate-700">
                            {r.reviewer?.name || 'Manager'}:
                          </span>{' '}
                          "{r.reviewer_comment}"
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancellingId === r.id}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          {cancellingId === r.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
