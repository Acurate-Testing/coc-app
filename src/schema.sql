-- 1. AGENCIES
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text not null,
  created_by uuid,
  created_at timestamp default current_timestamp,
  deleted_at timestamp default null
);

-- 2. ACCOUNTS
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agency_id uuid references public.agencies(id) on delete cascade,
  created_at timestamp default current_timestamp,
  deleted_at timestamp default null
);

-- 3. TEST TYPES
create table public.test_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid,
  created_at timestamp default current_timestamp,
  deleted_at timestamp default null
);

-- 4. USERS
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role text check (role in ('lab_admin', 'agency', 'user')) not null,
  agency_id uuid references public.agencies(id),
  created_at timestamp default current_timestamp,
  deleted_at timestamp default null
);

-- 5. ACCOUNT <-> TEST TYPES
create table public.agency_test_types (
  agency_id uuid references public.agencies(id) on delete cascade,
  test_type_id uuid references public.test_types(id) on delete cascade,
  primary key (agency_id, test_type_id),
  deleted_at timestamp default null
);

-- 6. SAMPLES
create table public.samples (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  agency_id uuid references public.agencies(id),
  account_id uuid references public.accounts(id),
  created_by uuid references public.users(id),
  pws_id text,
  matrix_type text,
 latitude numeric,
 longitude numeric,
  sample_collected_at timestamp,
  temperature numeric,
  notes text,
  status text check (status in ('pending', 'in_coc', 'submitted', 'pass', 'fail')) default 'pending',
  pass_fail_notes text,
  attachment_url text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  deleted_at timestamp default null
);

-- 7. SAMPLE <-> TEST TYPES
create table public.sample_test_types (
  sample_id uuid references public.samples(id) on delete cascade,
  test_type_id uuid references public.test_types(id) on delete cascade,
  primary key (sample_id, test_type_id),
  deleted_at timestamp default null
);

-- 8. CHAIN OF CUSTODY TRANSFERS
create table public.coc_transfers (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid references public.samples(id),
  transferred_by uuid references public.users(id),
  received_by uuid references public.users(id),
  timestamp timestamp not null default current_timestamp,
  latitude numeric,
 longitude numeric,
  signature text,
  deleted_at timestamp default null
);
