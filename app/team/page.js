'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TeamLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [meta, setMeta] = useState({ role: '', department: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTeamLeaves = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/team');

      if (!res.ok) {
        throw new Error('Failed to load team leaves');
      }

      const data = await res.json();
      setLeaves(data.leaves || []);
      setMeta({ role: data.role, department: data.department });
    } catch (err) {
      setError(err.message || 'Error fetching team leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamLeaves();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading team schedule...</p>
      </div>
    );
  }

  const isEmployee = meta.role === 'employee';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-indigo-600">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Team Leaves</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Team Leave Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEmployee
              ? `Showing approved leaves for the ${meta.department || 'your'} department`
              : 'Showing approved leaves company-wide (Manager & HR view)'}
          </p>
        </div>

        <button
          onClick={fetchTeamLeaves}
          className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
        >
          Refresh Schedule
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Plain Table of Upcoming Approved Leaves */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Approved Out-of-Office Schedule
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {leaves.length} Scheduled
          </span>
        </div>

        {leaves.length === 0 ? (
          <div className="text-center py-16 px-4">
            <svg
              className="mx-auto h-10 w-10 text-slate-300 mb-2"
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
            <p className="text-base font-semibold text-slate-800">No approved leaves</p>
            <p className="text-sm text-slate-500 mt-1">
              There are currently no approved leave schedules to display.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Who</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Leave Type</th>
                  <th className="px-6 py-3">From</th>
                  <th className="px-6 py-3">To</th>
                  <th className="px-6 py-3">Working Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {l.profiles?.name?.charAt(0) || 'U'}
                        </span>
                        <span>{l.profiles?.name || 'Employee'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">
                      {l.profiles?.department || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap text-xs font-medium">
                      {l.leave_types?.name}
                    </td>
                    <td className="px-6 py-4 text-slate-800 whitespace-nowrap font-mono text-xs">
                      {l.start_date}
                    </td>
                    <td className="px-6 py-4 text-slate-800 whitespace-nowrap font-mono text-xs">
                      {l.end_date}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap font-semibold text-xs">
                      {l.days} {l.days === 1 ? 'day' : 'days'}
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
