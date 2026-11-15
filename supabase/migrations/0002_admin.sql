-- Admin role: full read/write access to every table and to the exercise-images bucket.
-- Additive only: existing policies from 0001_init.sql are left untouched.

-- ---------------------------------------------------------------------------
-- Role check: allow 'admin' (the inline column check from 0001 is named profiles_role_check)
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('trainer', 'client', 'admin'));

-- ---------------------------------------------------------------------------
-- Helper (SECURITY DEFINER avoids recursive RLS on profiles, same pattern as is_trainer())
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Guard: nobody may change id or role from the app. Admins may additionally change
-- trainer_id (to assign a client to a trainer). The SQL editor and service role
-- (auth.uid() is null) still can change anything.
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
       or new.id is distinct from old.id then
      raise exception 'role and id cannot be modified';
    end if;
    if new.trainer_id is distinct from old.trainer_id and not public.is_admin() then
      raise exception 'trainer_id cannot be modified';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin policies (permissive, OR-ed with the existing per-role policies)
-- ---------------------------------------------------------------------------
-- profiles: read and update only (inserts go through the signup trigger; no deletes from the app).
create policy profiles_admin_select on public.profiles for select to authenticated
  using (public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy body_metrics_admin_all on public.body_metrics for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy exercises_admin_all on public.exercises for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy routines_admin_all on public.routines for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy routine_days_admin_all on public.routine_days for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy routine_exercises_admin_all on public.routine_exercises for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy workout_logs_admin_all on public.workout_logs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- client_training_dates() is SECURITY INVOKER, so workout_logs_admin_all already makes it
-- return every client's dates for an admin. No change needed.

-- ---------------------------------------------------------------------------
-- Storage: admins can write any object in the exercise-images bucket
-- (reads are already public).
-- ---------------------------------------------------------------------------
create policy exercise_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'exercise-images' and public.is_admin());
create policy exercise_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'exercise-images' and public.is_admin())
  with check (bucket_id = 'exercise-images' and public.is_admin());
create policy exercise_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'exercise-images' and public.is_admin());
