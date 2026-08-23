-- Donations: staff oversight
drop policy if exists "Staff can view all donations" on public.donations;
create policy "Staff can view all donations" on public.donations for select to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));
drop policy if exists "Admins can insert donations" on public.donations;
create policy "Admins can insert donations" on public.donations for insert to authenticated
  with check (has_role(auth.uid(),'admin'));
drop policy if exists "Admins can update donations" on public.donations;
create policy "Admins can update donations" on public.donations for update to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
drop policy if exists "Admins can delete donations" on public.donations;
create policy "Admins can delete donations" on public.donations for delete to authenticated
  using (has_role(auth.uid(),'admin'));

-- Subscriptions: staff oversight
drop policy if exists "Staff can view all subscriptions" on public.subscriptions;
create policy "Staff can view all subscriptions" on public.subscriptions for select to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));
drop policy if exists "Admins can update subscriptions" on public.subscriptions;
create policy "Admins can update subscriptions" on public.subscriptions for update to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
drop policy if exists "Admins can delete subscriptions" on public.subscriptions;
create policy "Admins can delete subscriptions" on public.subscriptions for delete to authenticated
  using (has_role(auth.uid(),'admin'));

-- Profiles: staff oversight
drop policy if exists "Staff can view all profiles" on public.profiles;
create policy "Staff can view all profiles" on public.profiles for select to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles for update to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles for delete to authenticated
  using (has_role(auth.uid(),'admin'));

-- Roles management
drop policy if exists "Admins can view all roles" on public.user_roles;
create policy "Admins can view all roles" on public.user_roles for select to authenticated
  using (has_role(auth.uid(),'admin'));
drop policy if exists "Admins can grant roles" on public.user_roles;
create policy "Admins can grant roles" on public.user_roles for insert to authenticated
  with check (has_role(auth.uid(),'admin'));
drop policy if exists "Admins can revoke roles" on public.user_roles;
create policy "Admins can revoke roles" on public.user_roles for delete to authenticated
  using (has_role(auth.uid(),'admin') and not (user_id = auth.uid() and role = 'admin'));

-- Deletion requests
drop policy if exists "Admins can view deletion requests" on public.account_deletion_requests;
create policy "Admins can view deletion requests" on public.account_deletion_requests for select to authenticated
  using (has_role(auth.uid(),'admin'));

grant select, insert, update, delete on public.donations to authenticated;
grant select, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select on public.account_deletion_requests to authenticated;
grant all on public.account_deletion_requests to service_role;