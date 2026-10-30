'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar({ profile, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on login page, don't show the full app navbar
  if (pathname === '/login') {
    return null;
  }

  const role = profile?.role || 'employee';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', roles: ['employee', 'manager', 'hr'] },
    { href: '/apply', label: 'Apply Leave', roles: ['employee', 'manager', 'hr'] },
    { href: '/approvals', label: 'Approvals', roles: ['manager'] },
    { href: '/hr', label: 'HR Portal', roles: ['hr'] },
    { href: '/team', label: 'Team Leaves', roles: ['employee', 'manager', 'hr'] },
  ];

  const allowedLinks = navLinks.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const roleBadgeColors = {
    hr: 'bg-purple-100 text-purple-800 border-purple-200',
    manager: 'bg-blue-100 text-blue-800 border-blue-200',
    employee: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Title */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                EL
              </span>
              <span className="font-semibold text-lg tracking-tight text-slate-900 hidden sm:inline">
                ELMS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {allowedLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-2 text-sm text-slate-700">
                <span className="font-medium">{profile.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${
                    roleBadgeColors[role] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {profile.role}
                </span>
                {profile.department && (
                  <span className="text-xs text-slate-500">
                    ({profile.department})
                  </span>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loggingOut ? 'Logging out...' : 'Sign out'}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 pt-2 pb-4 space-y-2 bg-white shadow-lg">
          {profile && (
            <div className="py-2 px-3 border-b border-slate-100 mb-2">
              <div className="font-medium text-slate-900">{profile.name}</div>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${
                    roleBadgeColors[role] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {profile.role}
                </span>
                {profile.department && (
                  <span className="text-xs text-slate-500">
                    {profile.department}
                  </span>
                )}
              </div>
            </div>
          )}

          {allowedLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            disabled={loggingOut}
            className="w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
          >
            {loggingOut ? 'Logging out...' : 'Sign out'}
          </button>
        </div>
      )}
    </header>
  );
}
