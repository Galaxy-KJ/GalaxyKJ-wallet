-- Allow users to insert execution rows for their own automations (e.g., enqueue manual)
create policy if not exists "Users can insert executions for own automations" on public.automation_executions
  for insert
  with check (
    exists (
      select 1 from public.automations a
      where a.id = automation_id and a.user_id = auth.uid()
    )
  );
