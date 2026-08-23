ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text;

CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  interest_area text not null,
  availability text,
  message text,
  status text not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_applications TO authenticated;
GRANT ALL ON public.volunteer_applications TO service_role;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own volunteer applications" ON public.volunteer_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can submit volunteer applications" ON public.volunteer_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can withdraw own pending applications" ON public.volunteer_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Staff can view all volunteer applications" ON public.volunteer_applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can update volunteer applications" ON public.volunteer_applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER update_volunteer_applications_updated_at BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.care_package_pitches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  estimated_cost_cents integer,
  status text not null default 'submitted',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_package_pitches TO authenticated;
GRANT ALL ON public.care_package_pitches TO service_role;
ALTER TABLE public.care_package_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pitches" ON public.care_package_pitches
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can submit pitches" ON public.care_package_pitches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own submitted pitches" ON public.care_package_pitches
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND status = 'submitted');
CREATE POLICY "Staff can view all pitches" ON public.care_package_pitches
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Staff can update pitches" ON public.care_package_pitches
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER update_care_package_pitches_updated_at BEFORE UPDATE ON public.care_package_pitches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

GRANT ALL ON public.account_deletion_requests TO service_role;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.purge_account_data(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.account_deletion_requests (user_id, email, completed_at)
  select _user_id, email, now() from public.profiles where id = _user_id;

  -- Keep financial history for statutory accounting, but strip identity.
  update public.donations set user_id = null, email = null where user_id = _user_id;

  delete from public.care_package_pitches where user_id = _user_id;
  delete from public.volunteer_applications where user_id = _user_id;
  delete from public.user_roles where user_id = _user_id;
  delete from public.profiles where id = _user_id;
end;
$$;

REVOKE ALL ON FUNCTION public.purge_account_data(uuid) FROM public, anon, authenticated;