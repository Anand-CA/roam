-- Public, curated discovery listings. User-owned data (profiles, saved places)
-- will be added separately with owner-scoped RLS policies.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create table if not exists public.discoveries (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Food', 'Cafe', 'Place', 'Event')),
  title text not null,
  detail text not null,
  budget_min_inr integer not null default 0 check (budget_min_inr >= 0),
  budget_max_inr integer not null default 0 check (budget_max_inr >= budget_min_inr),
  venue text,
  image_url text,
  note text,
  location extensions.geography(point, 4326) not null,
  starts_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists discoveries_location_idx
  on public.discoveries using gist (location);
create index if not exists discoveries_published_category_idx
  on public.discoveries (category) where is_published;

alter table public.discoveries enable row level security;
grant select on public.discoveries to anon, authenticated;
drop policy if exists "Anyone can read published discoveries" on public.discoveries;
create policy "Anyone can read published discoveries"
  on public.discoveries for select
  to anon, authenticated
  using (is_published);

create or replace function public.nearby_discoveries(
  user_latitude double precision,
  user_longitude double precision,
  radius_meters integer default 5000,
  category_filter text default null,
  result_limit integer default 20
)
returns table (
  id uuid,
  category text,
  title text,
  detail text,
  budget_min_inr integer,
  budget_max_inr integer,
  distance_meters double precision,
  image_url text,
  note text
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select d.id, d.category, d.title, d.detail, d.budget_min_inr, d.budget_max_inr,
    extensions.st_distance(d.location, extensions.st_setsrid(
      extensions.st_makepoint(user_longitude, user_latitude), 4326
    )::extensions.geography) as distance_meters,
    d.image_url, d.note
  from public.discoveries d
  where d.is_published
    and extensions.st_dwithin(d.location, extensions.st_setsrid(
      extensions.st_makepoint(user_longitude, user_latitude), 4326
    )::extensions.geography, least(greatest(radius_meters, 100), 25000))
    and (category_filter is null or d.category = category_filter)
  order by d.location <-> extensions.st_setsrid(
    extensions.st_makepoint(user_longitude, user_latitude), 4326
  )::extensions.geography
  limit least(greatest(result_limit, 1), 50);
$$;

grant execute on function public.nearby_discoveries(double precision, double precision, integer, text, integer)
  to anon, authenticated;

-- Clearly marked demo records let the first screen work before a real listings source is chosen.
insert into public.discoveries (id, category, title, detail, budget_min_inr, budget_max_inr, note, location, is_published, image_url) values
  ('154ef4d0-5af3-4c77-b375-243dc52be011', 'Food', 'Kochi Kitchen', 'Kerala cuisine', 800, 1500, 'Demo listing', extensions.st_makepoint(76.2425, 9.9650)::extensions.geography, true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'),
  ('154ef4d0-5af3-4c77-b375-243dc52be012', 'Cafe', 'Waterfront Coffee', 'Coffee & pastry', 250, 500, 'Demo listing', extensions.st_makepoint(76.2599, 9.9574)::extensions.geography, true, 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80'),
  ('154ef4d0-5af3-4c77-b375-243dc52be013', 'Place', 'Fort Kochi Walk', 'Heritage streets · Self-guided', 0, 0, 'Demo listing', extensions.st_makepoint(76.2424, 9.9654)::extensions.geography, true, 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80'),
  ('154ef4d0-5af3-4c77-b375-243dc52be014', 'Event', 'Kochi After Dark', 'Live music · Demo event', 499, 999, 'Demo listing', extensions.st_makepoint(76.2765, 9.9816)::extensions.geography, true, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80')
on conflict (id) do nothing;
