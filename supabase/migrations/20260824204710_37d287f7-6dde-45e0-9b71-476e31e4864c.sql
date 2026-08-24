
-- Daily totals
create table if not exists public.analytics_daily_totals (
  day date primary key,
  events integer not null default 0,
  page_views integer not null default 0,
  sign_ups integer not null default 0,
  sign_ins integer not null default 0,
  donate_clicks integer not null default 0
);

-- Daily dimension counts (kind: page, country, device, browser, referrer, source, event)
create table if not exists public.analytics_daily_dims (
  day date not null,
  kind text not null,
  value text not null,
  events integer not null default 0,
  page_views integer not null default 0,
  primary key (day, kind, value)
);

-- Unique visitors per day
create table if not exists public.analytics_daily_visitors (
  day date not null,
  visitor_id text not null,
  primary key (day, visitor_id)
);

-- Unique signed-in users per day
create table if not exists public.analytics_daily_users (
  day date not null,
  user_id uuid not null,
  primary key (day, user_id)
);

-- Sessions per day (for bounce rate / events per session)
create table if not exists public.analytics_daily_sessions (
  day date not null,
  session_id text not null,
  events integer not null default 0,
  primary key (day, session_id)
);

-- Unique visitors per page/country per day
create table if not exists public.analytics_daily_dim_visitors (
  day date not null,
  kind text not null,
  value text not null,
  visitor_id text not null,
  primary key (day, kind, value, visitor_id)
);

grant select on public.analytics_daily_totals to authenticated;
grant select on public.analytics_daily_dims to authenticated;
grant select on public.analytics_daily_visitors to authenticated;
grant select on public.analytics_daily_users to authenticated;
grant select on public.analytics_daily_sessions to authenticated;
grant select on public.analytics_daily_dim_visitors to authenticated;
grant all on public.analytics_daily_totals to service_role;
grant all on public.analytics_daily_dims to service_role;
grant all on public.analytics_daily_visitors to service_role;
grant all on public.analytics_daily_users to service_role;
grant all on public.analytics_daily_sessions to service_role;
grant all on public.analytics_daily_dim_visitors to service_role;

alter table public.analytics_daily_totals enable row level security;
alter table public.analytics_daily_dims enable row level security;
alter table public.analytics_daily_visitors enable row level security;
alter table public.analytics_daily_users enable row level security;
alter table public.analytics_daily_sessions enable row level security;
alter table public.analytics_daily_dim_visitors enable row level security;

create policy "Staff read analytics totals" on public.analytics_daily_totals for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Staff read analytics dims" on public.analytics_daily_dims for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Staff read analytics visitors" on public.analytics_daily_visitors for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Staff read analytics users" on public.analytics_daily_users for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Staff read analytics sessions" on public.analytics_daily_sessions for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "Staff read analytics dim visitors" on public.analytics_daily_dim_visitors for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create or replace function public.rollup_analytics_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (new.created_at at time zone 'utc')::date;
  is_view boolean := new.event_name = 'page_view';
  host text;
  src text;
begin
  insert into public.analytics_daily_totals (day, events, page_views, sign_ups, sign_ins, donate_clicks)
  values (
    d, 1, case when is_view then 1 else 0 end,
    case when new.event_name = 'sign_up' then 1 else 0 end,
    case when new.event_name in ('login','sign_in') then 1 else 0 end,
    case when new.event_name = 'donate_cta_click' then 1 else 0 end
  )
  on conflict (day) do update set
    events = analytics_daily_totals.events + 1,
    page_views = analytics_daily_totals.page_views + excluded.page_views,
    sign_ups = analytics_daily_totals.sign_ups + excluded.sign_ups,
    sign_ins = analytics_daily_totals.sign_ins + excluded.sign_ins,
    donate_clicks = analytics_daily_totals.donate_clicks + excluded.donate_clicks;

  insert into public.analytics_daily_visitors (day, visitor_id) values (d, new.visitor_id)
    on conflict do nothing;

  if new.is_authenticated and new.user_id is not null then
    insert into public.analytics_daily_users (day, user_id) values (d, new.user_id)
      on conflict do nothing;
  end if;

  insert into public.analytics_daily_sessions (day, session_id, events) values (d, new.session_id, 1)
    on conflict (day, session_id) do update set events = analytics_daily_sessions.events + 1;

  insert into public.analytics_daily_dims (day, kind, value, events, page_views)
  values (d, 'event', new.event_name, 1, 0)
  on conflict (day, kind, value) do update set events = analytics_daily_dims.events + 1;

  insert into public.analytics_daily_dims (day, kind, value, events, page_views)
  values (d, 'device', coalesce(new.device_category, 'unknown'), 1, 0)
  on conflict (day, kind, value) do update set events = analytics_daily_dims.events + 1;

  insert into public.analytics_daily_dims (day, kind, value, events, page_views)
  values (d, 'browser', coalesce(new.browser, 'unknown'), 1, 0)
  on conflict (day, kind, value) do update set events = analytics_daily_dims.events + 1;

  if is_view then
    insert into public.analytics_daily_dims (day, kind, value, events, page_views)
    values (d, 'page', new.page_path, 1, 1)
    on conflict (day, kind, value) do update set
      events = analytics_daily_dims.events + 1,
      page_views = analytics_daily_dims.page_views + 1;

    insert into public.analytics_daily_dim_visitors (day, kind, value, visitor_id)
    values (d, 'page', new.page_path, new.visitor_id) on conflict do nothing;

    insert into public.analytics_daily_dims (day, kind, value, events, page_views)
    values (d, 'country', coalesce(new.country, 'Unknown'), 1, 1)
    on conflict (day, kind, value) do update set
      events = analytics_daily_dims.events + 1,
      page_views = analytics_daily_dims.page_views + 1;

    insert into public.analytics_daily_dim_visitors (day, kind, value, visitor_id)
    values (d, 'country', coalesce(new.country, 'Unknown'), new.visitor_id) on conflict do nothing;

    host := 'Direct';
    if new.referrer is not null and new.referrer <> '' then
      host := coalesce(nullif(regexp_replace(regexp_replace(new.referrer, '^https?://', ''), '(/.*)$', ''), ''), 'Direct');
      host := regexp_replace(host, '^www\.', '');
    end if;

    insert into public.analytics_daily_dims (day, kind, value, events, page_views)
    values (d, 'referrer', host, 1, 1)
    on conflict (day, kind, value) do update set
      events = analytics_daily_dims.events + 1,
      page_views = analytics_daily_dims.page_views + 1;

    src := coalesce(new.utm_source, case when host = 'Direct' then 'direct' else host end);
    insert into public.analytics_daily_dims (day, kind, value, events, page_views)
    values (d, 'source', src, 1, 1)
    on conflict (day, kind, value) do update set
      events = analytics_daily_dims.events + 1,
      page_views = analytics_daily_dims.page_views + 1;
  end if;

  return new;
end;
$$;

drop trigger if exists analytics_events_rollup on public.analytics_events;
create trigger analytics_events_rollup
  after insert on public.analytics_events
  for each row execute function public.rollup_analytics_event();

-- Retention: keep only the newest 100 raw rows
create or replace function public.prune_analytics_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz;
begin
  select created_at into cutoff
  from public.analytics_events
  order by created_at desc
  offset 100 limit 1;

  if cutoff is not null then
    delete from public.analytics_events where created_at <= cutoff;
  end if;

  return null;
end;
$$;

drop trigger if exists analytics_events_prune on public.analytics_events;
create trigger analytics_events_prune
  after insert on public.analytics_events
  for each statement execute function public.prune_analytics_events();

-- Backfill rollups from the rows currently stored, then prune to the newest 100.
insert into public.analytics_daily_totals (day, events, page_views, sign_ups, sign_ins, donate_clicks)
select (created_at at time zone 'utc')::date, count(*),
  count(*) filter (where event_name = 'page_view'),
  count(*) filter (where event_name = 'sign_up'),
  count(*) filter (where event_name in ('login','sign_in')),
  count(*) filter (where event_name = 'donate_cta_click')
from public.analytics_events group by 1
on conflict (day) do nothing;

insert into public.analytics_daily_visitors (day, visitor_id)
select distinct (created_at at time zone 'utc')::date, visitor_id from public.analytics_events
on conflict do nothing;

insert into public.analytics_daily_users (day, user_id)
select distinct (created_at at time zone 'utc')::date, user_id from public.analytics_events
where is_authenticated and user_id is not null
on conflict do nothing;

insert into public.analytics_daily_sessions (day, session_id, events)
select (created_at at time zone 'utc')::date, session_id, count(*)
from public.analytics_events group by 1,2
on conflict do nothing;

insert into public.analytics_daily_dims (day, kind, value, events, page_views)
select (created_at at time zone 'utc')::date, 'event', event_name, count(*), 0
from public.analytics_events group by 1,3
on conflict do nothing;

insert into public.analytics_daily_dims (day, kind, value, events, page_views)
select (created_at at time zone 'utc')::date, 'device', coalesce(device_category,'unknown'), count(*), 0
from public.analytics_events group by 1,3
on conflict do nothing;

insert into public.analytics_daily_dims (day, kind, value, events, page_views)
select (created_at at time zone 'utc')::date, 'browser', coalesce(browser,'unknown'), count(*), 0
from public.analytics_events group by 1,3
on conflict do nothing;

insert into public.analytics_daily_dims (day, kind, value, events, page_views)
select (created_at at time zone 'utc')::date, 'page', page_path, count(*), count(*)
from public.analytics_events where event_name = 'page_view' group by 1,3
on conflict do nothing;

insert into public.analytics_daily_dim_visitors (day, kind, value, visitor_id)
select distinct (created_at at time zone 'utc')::date, 'page', page_path, visitor_id
from public.analytics_events where event_name = 'page_view'
on conflict do nothing;

insert into public.analytics_daily_dims (day, kind, value, events, page_views)
select (created_at at time zone 'utc')::date, 'country', coalesce(country,'Unknown'), count(*), count(*)
from public.analytics_events where event_name = 'page_view' group by 1,3
on conflict do nothing;

insert into public.analytics_daily_dim_visitors (day, kind, value, visitor_id)
select distinct (created_at at time zone 'utc')::date, 'country', coalesce(country,'Unknown'), visitor_id
from public.analytics_events where event_name = 'page_view'
on conflict do nothing;
