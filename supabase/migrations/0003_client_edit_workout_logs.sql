-- Clients may now correct their own logged sets (typos in weight or reps).
-- Ownership cannot change: both the old and the new row must belong to the caller.
-- Delete stays trainer/admin only.
create policy workout_logs_client_update on public.workout_logs for update to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());
