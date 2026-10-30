import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = 'Demo@1234';

const LEAVE_TYPES = [
  { name: 'Casual', yearly_quota: 12 },
  { name: 'Sick', yearly_quota: 10 },
  { name: 'Earned', yearly_quota: 15 },
];

const HOLIDAYS = [
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas' },
  { date: '2027-01-01', name: 'New Year' },
  { date: '2027-01-26', name: 'Republic Day' },
];

const USERS = [
  { email: 'hr@demo.com', name: 'Priya Sharma', role: 'hr', department: 'HR', managerKey: null },
  { email: 'manager1@demo.com', name: 'Rahul Verma', role: 'manager', department: 'Engineering', managerKey: null },
  { email: 'manager2@demo.com', name: 'Anita Das', role: 'manager', department: 'Marketing', managerKey: null },
  { email: 'emp1@demo.com', name: 'Amit Kumar', role: 'employee', department: 'Engineering', managerKey: 'manager1@demo.com' },
  { email: 'emp2@demo.com', name: 'Sneha Rao', role: 'employee', department: 'Engineering', managerKey: 'manager1@demo.com' },
  { email: 'emp3@demo.com', name: 'Vikram Singh', role: 'employee', department: 'Marketing', managerKey: 'manager2@demo.com' },
  { email: 'emp4@demo.com', name: 'Neha Patel', role: 'employee', department: 'Marketing', managerKey: 'manager2@demo.com' },
];

async function seed() {
  console.log('--- Starting ELMS Database Seed ---');

  // 1. Seed Leave Types
  console.log('Seeding leave types...');
  for (const lt of LEAVE_TYPES) {
    const { error } = await supabase
      .from('leave_types')
      .upsert(lt, { onConflict: 'name' });
    if (error) console.error(`Failed to upsert leave type ${lt.name}:`, error.message);
  }

  const { data: leaveTypesDb } = await supabase.from('leave_types').select('*');
  const leaveTypeMap = {};
  for (const lt of leaveTypesDb) {
    leaveTypeMap[lt.name] = lt;
  }

  // 2. Seed Holidays
  console.log('Seeding holidays...');
  for (const h of HOLIDAYS) {
    const { error } = await supabase
      .from('holidays')
      .upsert(h, { onConflict: 'date' });
    if (error) console.error(`Failed to upsert holiday ${h.name}:`, error.message);
  }

  // 3. Create or Fetch Auth Users
  console.log('Seeding auth users and profiles...');
  const { data: existingUsersRes } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const existingUsersByEmail = new Map();
  if (existingUsersRes?.users) {
    for (const u of existingUsersRes.users) {
      existingUsersByEmail.set(u.email.toLowerCase(), u);
    }
  }

  const userMap = {}; // email -> { id, ... }

  for (const u of USERS) {
    let authUser = existingUsersByEmail.get(u.email.toLowerCase());
    if (!authUser) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: u.name },
      });
      if (createError) {
        console.error(`Error creating auth user ${u.email}:`, createError.message);
        continue;
      }
      authUser = created.user;
    }

    userMap[u.email] = { ...u, id: authUser.id };

    // Upsert profile without manager_id first
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: authUser.id,
        name: u.name,
        role: u.role,
        department: u.department,
      },
      { onConflict: 'id' }
    );
    if (profileError) console.error(`Profile upsert error for ${u.email}:`, profileError.message);
  }

  // 4. Update manager_id for profiles
  console.log('Linking manager IDs...');
  for (const u of USERS) {
    const profile = userMap[u.email];
    if (!profile) continue;

    const manager = u.managerKey ? userMap[u.managerKey] : null;
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: manager ? manager.id : null })
      .eq('id', profile.id);
    if (error) console.error(`Failed to update manager for ${u.email}:`, error.message);
  }

  // 5. Seed Sample Leave Requests
  console.log('Seeding sample leave requests...');
  const sampleRequests = [
    {
      userEmail: 'emp1@demo.com',
      typeName: 'Casual',
      start_date: '2026-10-12',
      end_date: '2026-10-13',
      days: 2,
      reason: 'Family function',
      status: 'APPROVED',
      reviewerEmail: 'manager1@demo.com',
      reviewer_comment: 'Approved. Enjoy!',
    },
    {
      userEmail: 'emp1@demo.com',
      typeName: 'Sick',
      start_date: '2026-09-03',
      end_date: '2026-09-03',
      days: 1,
      reason: 'Fever',
      status: 'APPROVED',
      reviewerEmail: 'manager1@demo.com',
      reviewer_comment: 'Take care and rest well.',
    },
    {
      userEmail: 'emp1@demo.com',
      typeName: 'Earned',
      start_date: '2026-11-16',
      end_date: '2026-11-20',
      days: 5,
      reason: 'Trip',
      status: 'PENDING',
      reviewerEmail: null,
      reviewer_comment: null,
    },
    {
      userEmail: 'emp2@demo.com',
      typeName: 'Casual',
      start_date: '2026-11-02',
      end_date: '2026-11-03',
      days: 2,
      reason: 'Personal work',
      status: 'PENDING',
      reviewerEmail: null,
      reviewer_comment: null,
    },
    {
      userEmail: 'emp2@demo.com',
      typeName: 'Sick',
      start_date: '2026-08-18',
      end_date: '2026-08-19',
      days: 2,
      reason: 'Medical',
      status: 'APPROVED',
      reviewerEmail: 'manager1@demo.com',
      reviewer_comment: 'Approved, get well soon.',
    },
    {
      userEmail: 'emp3@demo.com',
      typeName: 'Earned',
      start_date: '2026-10-05',
      end_date: '2026-10-09',
      days: 5,
      reason: 'Vacation',
      status: 'APPROVED',
      reviewerEmail: 'manager2@demo.com',
      reviewer_comment: 'Have a great vacation!',
    },
    {
      userEmail: 'emp3@demo.com',
      typeName: 'Casual',
      start_date: '2026-11-23',
      end_date: '2026-11-23',
      days: 1,
      reason: 'Errand',
      status: 'REJECTED',
      reviewerEmail: 'manager2@demo.com',
      reviewer_comment: 'Product launch that week',
    },
    {
      userEmail: 'emp4@demo.com',
      typeName: 'Casual',
      start_date: '2026-12-01',
      end_date: '2026-12-02',
      days: 2,
      reason: 'Wedding',
      status: 'PENDING',
      reviewerEmail: null,
      reviewer_comment: null,
    },
  ];

  for (const req of sampleRequests) {
    const user = userMap[req.userEmail];
    const reviewer = req.reviewerEmail ? userMap[req.reviewerEmail] : null;
    const leaveType = leaveTypeMap[req.typeName];

    if (!user || !leaveType) continue;

    // Check if duplicate request exists to allow safe re-running
    const { data: existingReq } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('start_date', req.start_date)
      .eq('end_date', req.end_date)
      .maybeSingle();

    if (!existingReq) {
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user.id,
        leave_type_id: leaveType.id,
        start_date: req.start_date,
        end_date: req.end_date,
        days: req.days,
        reason: req.reason,
        status: req.status,
        reviewer_id: reviewer ? reviewer.id : null,
        reviewer_comment: req.reviewer_comment,
      });
      if (error) console.error(`Error inserting request for ${req.userEmail}:`, error.message);
    }
  }

  // 6. Calculate & Seed Balances (quota minus approved days)
  console.log('Calculating and seeding leave balances...');
  // Fetch all approved requests to accurately calculate deductions
  const { data: approvedRequests } = await supabase
    .from('leave_requests')
    .select('user_id, leave_type_id, days')
    .eq('status', 'APPROVED');

  const approvedDaysMap = {}; // `${userId}_${leaveTypeId}` -> total approved days
  if (approvedRequests) {
    for (const r of approvedRequests) {
      const key = `${r.user_id}_${r.leave_type_id}`;
      approvedDaysMap[key] = (approvedDaysMap[key] || 0) + Number(r.days);
    }
  }

  for (const email of Object.keys(userMap)) {
    const user = userMap[email];
    for (const lt of leaveTypesDb) {
      const key = `${user.id}_${lt.id}`;
      const usedDays = approvedDaysMap[key] || 0;
      const remaining = Math.max(0, lt.yearly_quota - usedDays);

      const { error } = await supabase.from('leave_balances').upsert(
        {
          user_id: user.id,
          leave_type_id: lt.id,
          remaining: remaining,
        },
        { onConflict: 'user_id,leave_type_id' }
      );
      if (error) console.error(`Balance error for ${user.email} (${lt.name}):`, error.message);
    }
  }

  console.log('\n=============================================');
  console.log('  ELMS DEMO CREDENTIALS');
  console.log('  Password for all accounts: Demo@1234');
  console.log('=============================================');
  console.log('HR:');
  console.log('  - hr@demo.com (Priya Sharma - HR)');
  console.log('Managers:');
  console.log('  - manager1@demo.com (Rahul Verma - Engineering Manager)');
  console.log('  - manager2@demo.com (Anita Das - Marketing Manager)');
  console.log('Employees:');
  console.log('  - emp1@demo.com (Amit Kumar - Engineering, Manager: Rahul)');
  console.log('  - emp2@demo.com (Sneha Rao - Engineering, Manager: Rahul)');
  console.log('  - emp3@demo.com (Vikram Singh - Marketing, Manager: Anita)');
  console.log('  - emp4@demo.com (Neha Patel - Marketing, Manager: Anita)');
  console.log('=============================================\n');
  console.log('Seed completed successfully!');
}

seed().catch((err) => {
  console.error('Fatal seed script error:', err);
  process.exit(1);
});
