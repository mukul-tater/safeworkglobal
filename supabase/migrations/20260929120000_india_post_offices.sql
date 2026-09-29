-- India Post PIN directory. Localities are imported once by
-- scripts/import-india-post-offices.mjs. Forms read them by district;
-- they do not call an external API.

create table if not exists public.india_post_offices (
  id bigint generated always as identity primary key,
  state text not null,
  district text not null,
  office_name text not null,
  pincode text not null,
  office_type text not null,
  constraint india_post_offices_pincode_chk check (pincode ~ '^[1-9][0-9]{5}$'),
  constraint india_post_offices_place_key unique (state, district, office_name, pincode)
);

create index if not exists india_post_offices_state_district_idx
  on public.india_post_offices (state, district);

create index if not exists india_post_offices_state_name_idx
  on public.india_post_offices (state, lower(office_name));

alter table public.india_post_offices enable row level security;

drop policy if exists "Anyone can read India post offices" on public.india_post_offices;
create policy "Anyone can read India post offices"
  on public.india_post_offices
  for select
  to anon, authenticated
  using (true);

grant select on public.india_post_offices to anon, authenticated;

-- One jsonb payload so a district with more than 1,000 offices is not cut off
-- by the PostgREST row cap.
create or replace function public.india_localities(p_state text, p_district text)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(jsonb_build_object('name', name, 'pincodes', pincodes) order by name)
      from (
        select office_name as name,
               array_agg(distinct pincode order by pincode) as pincodes
        from public.india_post_offices
        where state = btrim(p_state)
          and district = btrim(p_district)
        group by office_name
      ) grouped
    ),
    '[]'::jsonb
  );
$$;

create or replace function public.india_locality_search(p_state text, p_query text)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(jsonb_build_object('name', name, 'pincodes', pincodes) order by name)
      from (
        select office_name as name,
               array_agg(distinct pincode order by pincode) as pincodes
        from public.india_post_offices
        where state = btrim(p_state)
          and char_length(btrim(p_query)) >= 2
          and lower(office_name) like lower(btrim(p_query)) || '%'
        group by office_name
        order by office_name
        limit 50
      ) grouped
    ),
    '[]'::jsonb
  );
$$;

create or replace function public.india_find_district(p_state text, p_city text)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select district
  from public.india_post_offices
  where state = btrim(p_state)
    and lower(office_name) = lower(btrim(p_city))
  limit 1;
$$;

revoke all on function public.india_localities(text, text) from public;
revoke all on function public.india_locality_search(text, text) from public;
revoke all on function public.india_find_district(text, text) from public;

grant execute on function public.india_localities(text, text) to anon, authenticated;
grant execute on function public.india_locality_search(text, text) to anon, authenticated;
grant execute on function public.india_find_district(text, text) to anon, authenticated;
