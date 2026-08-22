ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS policies_accepted_at timestamptz;

UPDATE public.profiles SET policies_accepted_at = now() WHERE policies_accepted_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, email, policies_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    case when coalesce(new.raw_user_meta_data ->> 'policies_accepted', 'false') = 'true' then now() else null end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'donor')
  on conflict (user_id, role) do nothing;

  return new;
end;
$function$;