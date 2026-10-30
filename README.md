# Employee Leave Management System (ELMS)

A minimal, fast, and demo-ready web application to automate employee leave application, manager approvals, remaining quota tracking, team schedules, and HR analytics.

Built for clean presentation and straightforward code explanation during college demos.

---

## 🛠 Tech Stack & Why It Is Minimal

| Technology | Purpose |
|---|---|
| **Next.js (App Router, JS)** | Modern React server components and route handlers without complex build setups or TypeScript compilation overhead. |
| **Tailwind CSS** | Clean, responsive, and consistent styling using standard utility classes without heavy UI libraries. |
| **Supabase** | Managed PostgreSQL database and built-in email/password authentication. |
| `@supabase/ssr` & `@supabase/supabase-js` | Official cookie-based session handling and server-side service-role client. |

### Why Minimal?
- **Zero Heavy ORMs**: Direct SQL schema in Supabase with standard Supabase client queries. No Prisma migrations or schema synchronization errors.
- **Zero Heavy Validation Libraries**: Form and date logic validated via readable, standard JavaScript `if` statements.
- **Zero UI / Chart / Calendar Libraries**: Built with native HTML5 form controls, responsive CSS bars, and clean Tailwind components. Everything can be read and understood by any developer in 5 minutes.

---

## 🔐 Architecture & Security Model

1. **Authentication via Supabase SSR Cookies**:
   - Follows the official `@supabase/ssr` architecture.
   - User sessions are stored in HTTP cookies and automatically refreshed via Next.js `middleware.js`.
2. **Strict Server-Side Admin Isolation**:
   - `lib/supabaseAdmin.js` initializes a service-role client on the server.
   - **The `SUPABASE_SERVICE_ROLE_KEY` is never sent to or bundled with the browser.**
3. **Database RLS Protection**:
   - Row Level Security (RLS) is enabled on all tables (`profiles`, `leave_types`, `leave_balances`, `leave_requests`, `holidays`) without public policies.
   - The public anon key cannot query or modify private records directly.
   - All authorization checks are executed inside server-side Route Handlers: the logged-in user is authenticated, their role is verified from `profiles`, and permissions are enforced.

---

## 👥 Roles & Permission Matrix

| Feature / Page | Employee | Manager | HR |
|---|:---:|:---:|:---:|
| **Sign In** (`/login`) | ✅ | ✅ | ✅ |
| **Dashboard** (`/dashboard` - balances & own requests) | ✅ | ✅ | ✅ |
| **Cancel Pending Leave** (own pending requests) | ✅ | ✅ | ✅ |
| **Apply for Leave** (`/apply`) | ✅ | ✅ | ✅ |
| **Review Team Leaves** (`/approvals` - direct reports) | ❌ | ✅ | ✅ |
| **Team Schedule** (`/team`) | ✅ (Own Dept) | ✅ (All) | ✅ (All) |
| **HR Portal** (`/hr` - all requests & stats) | ❌ | ❌ | ✅ |
| **Download CSV** (`/api/hr/export-csv`) | ❌ | ❌ | ✅ |

---

## 🔑 Demo Accounts & Credentials

All accounts share the default password: **`Demo@1234`**

| Role | Name | Email | Notes |
|---|---|---|---|
| **HR** | Priya Sharma | `hr@demo.com` | Full HR portal, CSV download, company stats |
| **Manager** | Rahul Verma | `manager1@demo.com` | Engineering Manager (approves Amit & Sneha) |
| **Manager** | Anita Das | `manager2@demo.com` | Marketing Manager (approves Vikram & Neha) |
| **Employee** | Amit Kumar | `emp1@demo.com` | Engineering (Manager: Rahul Verma) |
| **Employee** | Sneha Rao | `emp2@demo.com` | Engineering (Manager: Rahul Verma) |
| **Employee** | Vikram Singh | `emp3@demo.com` | Marketing (Manager: Anita Das) |
| **Employee** | Neha Patel | `emp4@demo.com` | Marketing (Manager: Anita Das) |

> 💡 **Demo Tip**: The login page has quick-fill buttons so you can switch between HR, Manager, and Employee with a single click during presentations.

---

## 🚀 Setup Steps (Local Development)

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** (found under *Project Settings -> API*).

### 2. Set Up the Database Schema
1. In the Supabase Dashboard, open the **SQL Editor** from the left navigation.
2. Open `supabase/schema.sql` from this repository, paste the contents into the SQL Editor, and click **Run**.
3. All required tables (`profiles`, `leave_types`, `leave_balances`, `leave_requests`, `holidays`) and RLS will be created.

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run the Database Seed Script
Populate leave types, company holidays, auth users, profiles, manager relationships, sample requests, and calculated balances:
```bash
npm run seed
```
*(Requires Node.js 20+; uses native `--env-file=.env.local`)*

### 5. Start the Next.js Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. Go to [Vercel](https://vercel.com) and click **Add New -> Project**.
3. Import your repository.
4. Under **Environment Variables**, add the 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. Vercel will build and deploy the Next.js App Router project automatically.

---

## 📂 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── apply/
│   │   │   └── form-data/route.js    # Form data (types, balances, holidays)
│   │   ├── approvals/
│   │   │   ├── route.js              # Fetch pending requests of direct reports
│   │   │   └── review/route.js       # Manager approve/reject & balance deduction
│   │   ├── auth/
│   │   │   ├── login/route.js        # Email/password authentication
│   │   │   ├── logout/route.js       # Session signout
│   │   │   └── me/route.js           # Current session & profile
│   │   ├── dashboard/route.js        # User balances & request history
│   │   ├── hr/
│   │   │   ├── data/route.js         # HR records, filters & summary statistics
│   │   │   └── export-csv/route.js   # RFC-compliant CSV report generator
│   │   ├── requests/
│   │   │   ├── apply/route.js        # Strict leave application validation
│   │   │   └── cancel/route.js       # Employee self-cancellation
│   │   └── team/route.js             # Department/role filtered team schedule
│   ├── apply/page.js                 # Apply leave page with live working-day counter
│   ├── approvals/page.js             # Manager approvals page with comment box
│   ├── dashboard/page.js             # Balance cards and request history
│   ├── hr/page.js                    # HR portal with filters, summary bars, & CSV
│   ├── login/page.js                 # Sign-in page with 1-click demo accounts
│   ├── team/page.js                  # Team upcoming approved leave schedule
│   ├── globals.css                   # Global styles & Tailwind CSS
│   ├── layout.js                     # Root layout with role-aware Navbar
│   └── page.js                       # Home redirect logic
├── components/
│   └── Navbar.js                     # Dynamic, role-based navigation bar
├── lib/
│   ├── supabaseAdmin.js              # Server-side service-role client (RLS bypass)
│   ├── supabaseClient.js             # Client-side Supabase helper
│   ├── supabaseServer.js             # Server-side SSR cookies client & session helper
│   └── workingDays.js                # Mon-Fri working days calculation excluding holidays
├── scripts/
│   └── seed.mjs                      # Idempotent DB seeder with sample requests
├── supabase/
│   └── schema.sql                    # Postgres schema definition
├── middleware.js                     # Route protection & SSR token refresher
├── package.json
└── README.md
```

---

## 📋 Core Validation Rules

- **End Date >= Start Date**: Prevents inverted intervals.
- **Working Day Calculation**: Counts Mondays through Fridays while skipping days listed in `holidays`.
- **Positive Working Days**: Rejects submissions that consist exclusively of weekends and public holidays (`days > 0`).
- **Quota / Balance Check**: Rejects leave if `requested days > remaining balance`.
- **Date Overlap Prevention**: Rejects any request if the employee already has a `PENDING` or `APPROVED` request overlapping the requested interval (`start_date <= existing_end AND end_date >= existing_start`).
- **Approval Deduction**: When a manager approves a request, `days` are deducted from `leave_balances.remaining`, and reviewer notes are recorded.
