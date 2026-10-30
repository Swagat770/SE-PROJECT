'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { label: 'HR (Priya Sharma)', email: 'hr@demo.com', role: 'HR', tag: 'hr' },
    { label: 'Manager Eng (Rahul Verma)', email: 'manager1@demo.com', role: 'Engineering Manager', tag: 'manager' },
    { label: 'Manager Mkt (Anita Das)', email: 'manager2@demo.com', role: 'Marketing Manager', tag: 'manager' },
    { label: 'Employee (Amit Kumar)', email: 'emp1@demo.com', role: 'Engineer (under Rahul)', tag: 'employee' },
    { label: 'Employee (Sneha Rao)', email: 'emp2@demo.com', role: 'Engineer (under Rahul)', tag: 'employee' },
    { label: 'Employee (Vikram Singh)', email: 'emp3@demo.com', role: 'Marketer (under Anita)', tag: 'employee' },
  ];

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Demo@1234');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Successful login -> route to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto text-white font-bold text-xl shadow-sm">
            EL
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
            Sign in to ELMS
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            Employee Leave Management System
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Demo Credentials (Password: Demo@1234)
            </span>
            <span className="text-xs text-indigo-600">Click to autofill</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {demoAccounts.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo.email)}
                className="text-left px-3 py-2 text-xs rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-slate-800 group-hover:text-indigo-700">
                    {demo.label}
                  </div>
                  <div className="text-slate-500 text-[11px]">{demo.email}</div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                  {demo.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
