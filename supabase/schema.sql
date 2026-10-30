-- Schema for Employee Leave Management System (ELMS)
-- Run this in your Supabase project SQL Editor

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('employee','manager','hr')),
  department text,
  manager_id uuid references profiles(id)
);

create table if not exists leave_types (
  id serial primary key,
  name text not null unique,
  yearly_quota int not null
);

create table if not exists leave_balances (
  id serial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  leave_type_id int not null references leave_types(id),
  remaining numeric not null,
  unique (user_id, leave_type_id)
);

create table if not exists leave_requests (
  id serial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  leave_type_id int not null references leave_types(id),
  start_date date not null,
  end_date date not null,
  days numeric not null,
  reason text,
  status text not null default 'PENDING'
    check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  reviewer_id uuid references profiles(id),
  reviewer_comment text,
  created_at timestamptz default now()
);

create table if not exists holidays (
  id serial primary key,
  date date not null unique,
  name text not null
);

-- Enable Row Level Security (RLS) on all tables
-- With no public policies, anon key cannot read/write directly.
-- All secure mutations and queries happen server-side using service_role key.
alter table profiles enable row level security;
alter table leave_types enable row level security;
alter table leave_balances enable row level security;
alter table leave_requests enable row level security;
alter table holidays enable row level security;
