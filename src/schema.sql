create table public.test_types (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  description text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  test_code text null,
  matrix_types text[] null default array['Potable Water'::text],
  constraint test_types_pkey primary key (id),
  constraint test_types_created_by_fkey foreign KEY (created_by) references users (id)
) TABLESPACE pg_default;

create table public.accounts (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  agency_id uuid null,
  created_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  constraint accounts_pkey primary key (id),
  constraint accounts_agency_id_fkey foreign KEY (agency_id) references agencies (id)
) TABLESPACE pg_default;

create table public.agencies (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  contact_email text not null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  phone text null,
  street text null,
  city text null,
  state text null,
  zip text null,
  constraint agencies_pkey primary key (id),
  constraint agencies_created_by_fkey foreign KEY (created_by) references users (id)
) TABLESPACE pg_default;

create table public.samples (
  id uuid not null default extensions.uuid_generate_v4 (),
  project_id text null,
  agency_id uuid null,
  account_id uuid null,
  created_by uuid null,
  pws_id text null,
  matrix_type text null,
  latitude double precision null,
  longitude double precision null,
  sample_collected_at timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
  temperature double precision null,
  notes text null,
  status text not null,
  pass_fail_notes text null,
  attachment_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  sample_type text null,
  sample_location text null,
  sample_privacy text null,
  chlorine_residual text null,
  county text null,
  compliance text null,
  saved_at timestamp with time zone null default now(),
  source text null,
  matrix_name text null,
  test_group_id uuid null,
  constraint samples_pkey primary key (id),
  constraint samples_agency_id_fkey foreign KEY (agency_id) references agencies (id),
  constraint samples_created_by_fkey foreign KEY (created_by) references users (id),
  constraint samples_account_id_fkey foreign KEY (account_id) references accounts (id),
  constraint samples_test_group_id_fkey foreign KEY (test_group_id) references test_groups (id),
  constraint samples_sample_privacy_check check (
    (
      sample_privacy = any (array['Private'::text, 'Public'::text])
    )
  ),
  constraint samples_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'in_coc'::text,
          'submitted'::text,
          'pass'::text,
          'fail'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.sample_test_types (
  sample_id uuid not null,
  test_type_id uuid not null,
  deleted_at timestamp with time zone null,
  constraint sample_test_types_pkey primary key (sample_id, test_type_id),
  constraint sample_test_types_sample_id_fkey foreign KEY (sample_id) references samples (id) on delete CASCADE,
  constraint sample_test_types_test_type_id_fkey foreign KEY (test_type_id) references test_types (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.agency_test_types (
  agency_id uuid not null,
  test_type_id uuid not null,
  deleted_at timestamp with time zone null,
  constraint agency_test_types_pkey primary key (agency_id, test_type_id),
  constraint agency_test_types_agency_id_fkey foreign KEY (agency_id) references agencies (id) on delete CASCADE,
  constraint agency_test_types_test_type_id_fkey foreign KEY (test_type_id) references test_types (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.coc_transfers (
  id uuid not null default extensions.uuid_generate_v4 (),
  sample_id uuid null,
  transferred_by uuid null,
  received_by uuid null,
  timestamp timestamp with time zone null default now(),
  latitude double precision null,
  longitude double precision null,
  signature text null,
  deleted_at timestamp with time zone null,
  photo_url text null,
  constraint coc_transfers_pkey primary key (id),
  constraint coc_transfers_received_by_fkey foreign KEY (received_by) references users (id),
  constraint coc_transfers_sample_id_fkey foreign KEY (sample_id) references samples (id) on delete CASCADE,
  constraint coc_transfers_transferred_by_fkey foreign KEY (transferred_by) references users (id)
) TABLESPACE pg_default;

create table public.test_types (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  description text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  test_code text null,
  matrix_types text[] null default array['Potable Water'::text],
  constraint test_types_pkey primary key (id),
  constraint test_types_created_by_fkey foreign KEY (created_by) references users (id)
) TABLESPACE pg_default;

create table public.test_groups (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  description text null,
  test_type_ids uuid[] null default '{}'::uuid[],
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  constraint test_groups_pkey primary key (id),
  constraint test_groups_created_by_fkey foreign KEY (created_by) references users (id)
) TABLESPACE pg_default;