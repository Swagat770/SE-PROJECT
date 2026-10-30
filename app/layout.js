import './globals.css';
import Navbar from '@/components/Navbar';
import { getAuthUserAndProfile } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Employee Leave Management System (ELMS)',
  description: 'Automated leave application, approval, tracking and record management',
};

export default async function RootLayout({ children }) {
  let profile = null;
  let user = null;

  try {
    const authData = await getAuthUserAndProfile();
    profile = authData.profile;
    user = authData.user;
  } catch (err) {
    // If unauthenticated or offline, user and profile remain null
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        <Navbar profile={profile} user={user} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
