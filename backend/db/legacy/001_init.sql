create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text,
  display_name text,
  role text not null default 'learner' check (role in ('learner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create unique index if not exists app_users_email_lower_idx on app_users (lower(email));

create table if not exists lesson_tracks (
  id text primary key,
  name text not null,
  summary text not null,
  sort_order integer not null default 0
);

create table if not exists lessons (
  id text primary key,
  track_id text not null references lesson_tracks(id) on delete restrict,
  title text not null,
  duration_min integer not null check (duration_min > 0 and duration_min <= 180),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lessons_track_id_sort_idx on lessons (track_id, sort_order);

create table if not exists voice_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  voice_type text not null,
  voice_color text not null,
  lowest_note text not null,
  highest_note text not null,
  range_semitones integer not null check (range_semitones >= 0),
  passaggio_hint text,
  roadmap_stage text not null check (roadmap_stage in ('beginner', 'intermediate', 'advanced')),
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists voice_profiles_user_created_idx on voice_profiles (user_id, created_at desc);

create table if not exists voice_embeddings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references voice_profiles(id) on delete cascade,
  embedding real[] not null,
  embedding_kind text not null default 'voice_profile',
  source text not null default 'python_ai_worker',
  created_at timestamptz not null default now(),
  constraint voice_embeddings_1536_dims check (array_length(embedding, 1) = 1536)
);

create table if not exists progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  lesson_id text references lessons(id) on delete set null,
  status text not null check (status in ('started', 'completed', 'skipped')),
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  analysis_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists progress_logs_user_created_idx on progress_logs (user_id, created_at desc);
create index if not exists progress_logs_lesson_idx on progress_logs (lesson_id);

create table if not exists analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  job_type text not null check (job_type in ('swiftf0', 'rmvpe', 'crepe', 'range', 'transposition', 'coach_payload')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  request_payload jsonb not null,
  result_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analysis_jobs_status_created_idx on analysis_jobs (status, created_at);
create index if not exists analysis_jobs_user_created_idx on analysis_jobs (user_id, created_at desc);
