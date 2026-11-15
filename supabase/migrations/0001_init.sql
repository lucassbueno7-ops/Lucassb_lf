-- Trainer App initial schema, RLS and helpers.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('trainer', 'client')),
  full_name text,
  height_cm numeric check (height_cm is null or height_cm > 0),
  trainer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric not null check (weight_kg > 0),
  notes text,
  -- One body weight per day; the app upserts on (client_id, measured_at).
  unique (client_id, measured_at)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  muscle_group text,
  video_url text,
  image_url text
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  active boolean not null default true
);

create table public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  name text not null,
  position int not null default 0,
  -- ISO weekdays this day is scheduled on: 1=Monday ... 7=Sunday.
  weekdays smallint[] not null default '{}'
    check (weekdays <@ array[1,2,3,4,5,6,7]::smallint[])
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sets int not null default 3 check (sets > 0),
  reps text not null default '10',
  target_weight_kg numeric,
  notes text,
  position int not null default 0
);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  routine_exercise_id uuid references public.routine_exercises (id) on delete set null,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  performed_at date not null default current_date,
  set_number int not null check (set_number > 0),
  weight_kg numeric not null check (weight_kg >= 0),
  reps int not null check (reps > 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes on foreign keys
-- ---------------------------------------------------------------------------
create index profiles_trainer_id_idx on public.profiles (trainer_id);
create index body_metrics_client_id_idx on public.body_metrics (client_id, measured_at);
create index exercises_trainer_id_idx on public.exercises (trainer_id);
create index routines_client_id_idx on public.routines (client_id);
create index routine_days_routine_id_idx on public.routine_days (routine_id);
create index routine_exercises_day_id_idx on public.routine_exercises (routine_day_id);
create index routine_exercises_exercise_id_idx on public.routine_exercises (exercise_id);
create index workout_logs_client_id_idx on public.workout_logs (client_id, performed_at);
create index workout_logs_routine_exercise_id_idx on public.workout_logs (routine_exercise_id);
create index workout_logs_exercise_id_idx on public.workout_logs (exercise_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------
create or replace function public.is_trainer_of(client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = client and trainer_id = auth.uid()
  );
$$;

create or replace function public.is_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'trainer'
  );
$$;

-- True when the caller is a client whose trainer owns the exercise.
create or replace function public.is_my_trainers_exercise(exercise_trainer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and trainer_id = exercise_trainer
  );
$$;

-- Routine-tree helpers: resolve ownership without evaluating RLS of parents.
create or replace function public.routine_client(routine uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.routines where id = routine;
$$;

create or replace function public.day_client(day uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select r.client_id
  from public.routine_days d join public.routines r on r.id = d.routine_id
  where d.id = day;
$$;

-- ---------------------------------------------------------------------------
-- Profile creation on signup (reads invite metadata)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_trainer uuid;
begin
  begin
    meta_trainer := nullif(new.raw_user_meta_data ->> 'trainer_id', '')::uuid;
  exception when others then
    meta_trainer := null;
  end;

  -- Only accept a trainer_id that points to an actual trainer.
  if meta_trainer is not null and not exists (
    select 1 from public.profiles where id = meta_trainer and role = 'trainer'
  ) then
    meta_trainer := null;
  end if;

  insert into public.profiles (id, role, full_name, trainer_id)
  values (new.id, 'client', new.raw_user_meta_data ->> 'full_name', meta_trainer);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Guard: authenticated users cannot change id / role / trainer_id of a profile.
-- The SQL editor and service role (auth.uid() is null) still can.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if new.role is distinct from old.role
       or new.trainer_id is distinct from old.trainer_id
       or new.id is distinct from old.id then
      raise exception 'role, trainer_id and id cannot be modified';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.body_metrics enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_logs enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_trainer_of(id));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_by_trainer on public.profiles for update to authenticated
  using (public.is_trainer_of(id)) with check (public.is_trainer_of(id));
-- Inserts happen only through the signup trigger (security definer): no insert policy.

-- body_metrics
create policy body_metrics_client_all on public.body_metrics for all to authenticated
  using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy body_metrics_trainer_all on public.body_metrics for all to authenticated
  using (public.is_trainer_of(client_id)) with check (public.is_trainer_of(client_id));

-- exercises
create policy exercises_trainer_all on public.exercises for all to authenticated
  using (trainer_id = auth.uid() and public.is_trainer())
  with check (trainer_id = auth.uid() and public.is_trainer());
create policy exercises_client_select on public.exercises for select to authenticated
  using (public.is_my_trainers_exercise(trainer_id));

-- routines
create policy routines_client_select on public.routines for select to authenticated
  using (client_id = auth.uid());
create policy routines_trainer_all on public.routines for all to authenticated
  using (public.is_trainer_of(client_id)) with check (public.is_trainer_of(client_id));

-- routine_days
create policy routine_days_client_select on public.routine_days for select to authenticated
  using (public.routine_client(routine_id) = auth.uid());
create policy routine_days_trainer_all on public.routine_days for all to authenticated
  using (public.is_trainer_of(public.routine_client(routine_id)))
  with check (public.is_trainer_of(public.routine_client(routine_id)));

-- routine_exercises
create policy routine_exercises_client_select on public.routine_exercises for select to authenticated
  using (public.day_client(routine_day_id) = auth.uid());
create policy routine_exercises_trainer_all on public.routine_exercises for all to authenticated
  using (public.is_trainer_of(public.day_client(routine_day_id)))
  with check (public.is_trainer_of(public.day_client(routine_day_id)));

-- workout_logs: clients may read and insert their own rows. No client update/delete:
-- history is append-only from the client side.
create policy workout_logs_client_select on public.workout_logs for select to authenticated
  using (client_id = auth.uid());
create policy workout_logs_client_insert on public.workout_logs for insert to authenticated
  with check (client_id = auth.uid());
create policy workout_logs_trainer_all on public.workout_logs for all to authenticated
  using (public.is_trainer_of(client_id)) with check (public.is_trainer_of(client_id));

-- Helper functions must not be callable by anon.
revoke execute on function public.is_trainer_of(uuid) from public, anon;
revoke execute on function public.is_trainer() from public, anon;
revoke execute on function public.is_my_trainers_exercise(uuid) from public, anon;
revoke execute on function public.routine_client(uuid) from public, anon;
revoke execute on function public.day_client(uuid) from public, anon;
grant execute on function public.is_trainer_of(uuid) to authenticated;
grant execute on function public.is_trainer() to authenticated;
grant execute on function public.is_my_trainers_exercise(uuid) to authenticated;
grant execute on function public.routine_client(uuid) to authenticated;
grant execute on function public.day_client(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Attendance: distinct training dates for every client the caller can see.
-- SECURITY INVOKER (default): RLS on workout_logs scopes rows to the trainer's own
-- clients. Returning one row per (client, day) avoids PostgREST's row cap that a
-- plain select over every logged set would hit.
-- ---------------------------------------------------------------------------
create or replace function public.client_training_dates(since date)
returns table (client_id uuid, performed_at date)
language sql
stable
as $$
  select distinct w.client_id, w.performed_at
  from public.workout_logs w
  where w.performed_at >= since;
$$;

revoke execute on function public.client_training_dates(date) from public, anon;
grant execute on function public.client_training_dates(date) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: exercise images
-- Tradeoff: the bucket is PUBLIC, so images are served via unauthenticated public
-- URLs (anyone with the URL can view). Exercise images are non-sensitive and this
-- keeps clients' reads simple (no signed URLs). Writes stay restricted: only
-- trainers, and only inside their own folder (first path segment = their uid).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('exercise-images', 'exercise-images', true)
on conflict (id) do nothing;

create policy exercise_images_trainer_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'exercise-images'
    and public.is_trainer()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy exercise_images_trainer_update on storage.objects for update to authenticated
  using (
    bucket_id = 'exercise-images'
    and public.is_trainer()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'exercise-images'
    and public.is_trainer()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy exercise_images_trainer_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'exercise-images'
    and public.is_trainer()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
