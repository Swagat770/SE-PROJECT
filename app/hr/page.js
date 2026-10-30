'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HrPortalPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deptSummary, setDeptSummary] = useState([]);
  const [monthSummary, setMonthSummary] = useState([]);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHrData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/hr/data');

      if (res.status === 403 || res.status === 401) {
        // Forbidden -> redirect to dashboard
        router.push('/dashboard');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load HR data');
      }

      const data = await res.json();
      setRequests(data.requests || []);
      setDepartments(data.departments || []);
      setDeptSummary(data.departmentSummary || []);
      setMonthSummary(data.monthSummary || []);
    } catch (err) {
      setError(err.message || 'Error loading HR portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrData();
  }, []);

  // Filter requests based on status, department, and search text
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      const dept = r.profiles?.department || '';
      const matchDept = selectedDept === 'ALL' || dept === selectedDept;
      const name = r.profiles?.name?.toLowerCase() || '';
      const reason = r.reason?.toLowerCase() || '';
      const matchSearch =
        !searchQuery.trim() ||
        name.includes(searchQuery.toLowerCase()) ||
        reason.includes(searchQuery.toLowerCase());

      return matchStatus && matchDept && matchSearch;
    });
  }, [requests, selectedStatus, selectedDept, searchQuery]);

  // Calculate maximum days for proportional CSS bars
  const maxDeptDays = useMemo(() => {
    return Math.max(...deptSummary.map((d) => d.days), 1);
  }, [deptSummary]);

  const maxMonthDays = useMemo(() => {
    return Math.max(...monthSummary.map((m) => m.days), 1);
  }, [monthSummary]);

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
      CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
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
        <p className="text-sm text-slate-500 font-medium">Loading HR management portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">HR Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            HR Leave Administration
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Company-wide leave records, analytics, and CSV reporting
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/api/hr/export-csv"
            download
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Analytics Section (Plain HTML Tables with CSS Bars) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Summary Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
            Approved Days Taken by Department
          </h2>
          {deptSummary.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No approved leave records yet</p>
          ) : (
            <div className="space-y-3">
              {deptSummary.map((d) => {
                const widthPct = Math.round((d.days / maxDeptDays) * 100);
                return (
                  <div key={d.department} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{d.department}</span>
                      <span className="font-semibold text-slate-900">{d.days} days</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.max(widthPct, d.days > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Summary Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
            Approved Days Taken by Month
          </h2>
          {monthSummary.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No approved leave records yet</p>
          ) : (
            <div className="space-y-3">
              {monthSummary.map((m) => {
                const widthPct = Math.round((m.days / maxMonthDays) * 100);
                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span className="font-mono">{m.month}</span>
                      <span className="font-semibold text-slate-900">{m.days} days</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.max(widthPct, m.days > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Requests Management Table with Filters */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="filterStatus">
                Filter by Status
              </label>
              <select
                id="filterStatus"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="filterDept">
                Filter by Department
              </label>
              <select
                id="filterDept"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="searchQuery">
                Search Employee or Reason
              </label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm font-medium text-slate-600">No requests match the selected filters</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the status or department filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Days</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {r.profiles?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">
                      {r.profiles?.department || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap font-medium text-xs">
                      {r.leave_types?.name}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap text-xs">
                      {r.start_date} <span className="text-slate-400 font-normal">to</span> {r.end_date}
                    </td>
                    <td className="px-6 py-4 text-slate-800 whitespace-nowrap font-semibold text-xs">
                      {r.days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs text-xs truncate" title={r.reason}>
                      {r.reason || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                      {r.reviewer?.name ? (
                        <div>
                          <span className="font-medium text-slate-700">{r.reviewer.name}</span>
                          {r.reviewer_comment && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                              "{r.reviewer_comment}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
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
