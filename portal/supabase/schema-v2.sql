-- Modo Turistagem Portal — schema v2
-- Pode ser executado mesmo se uma tentativa anterior tiver criado parte da estrutura.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists is_admin boolean not null default false;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  destination text,
  duration text,
  season text,
  version text,
  intro text,
  cover_image text,
  overview jsonb not null default '{}'::jsonb,
  content jsonb not null default '{"sections":[]}'::jsonb,
  status text not null default 'draft' check(status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.itinerary_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  access_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, itinerary_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := lower(
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(new.email, '@', 1)
    )
  );

  insert into public.profiles(id, email, username, full_name)
  values(
    new.id,
    new.email,
    generated_username,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      generated_username
    )
  )
  on conflict(id) do update set
    email = excluded.email,
    username = excluded.username,
    full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists itineraries_set_updated_at on public.itineraries;
create trigger itineraries_set_updated_at
before update on public.itineraries
for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_access enable row level security;

drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "admins update profiles" on public.profiles;
drop policy if exists "customers read granted published itineraries" on public.itineraries;
drop policy if exists "admins manage itineraries" on public.itineraries;
drop policy if exists "users read own access" on public.itinerary_access;
drop policy if exists "admins manage access" on public.itinerary_access;

create policy "users read own profile"
on public.profiles for select
using(id = auth.uid() or public.is_admin());

create policy "admins update profiles"
on public.profiles for update
using(public.is_admin())
with check(public.is_admin());

create policy "customers read granted published itineraries"
on public.itineraries for select
using(
  public.is_admin()
  or (
    status = 'published'
    and exists(
      select 1
      from public.itinerary_access access
      where access.itinerary_id = itineraries.id
        and access.user_id = auth.uid()
        and (
          access.access_expires_at is null
          or access.access_expires_at > now()
        )
    )
  )
);

create policy "admins manage itineraries"
on public.itineraries for all
using(public.is_admin())
with check(public.is_admin());

create policy "users read own access"
on public.itinerary_access for select
using(user_id = auth.uid() or public.is_admin());

create policy "admins manage access"
on public.itinerary_access for all
using(public.is_admin())
with check(public.is_admin());

create or replace function public.grant_itinerary_access_by_username(
  customer_username text,
  itinerary_slug text,
  expires_at_value timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  target_itinerary uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem liberar acessos.';
  end if;

  select id into target_user
  from public.profiles
  where lower(username) = lower(trim(customer_username))
  limit 1;

  if target_user is null then
    raise exception 'Usuário não encontrado.';
  end if;

  select id into target_itinerary
  from public.itineraries
  where slug = itinerary_slug
  limit 1;

  if target_itinerary is null then
    raise exception 'Roteiro não encontrado.';
  end if;

  insert into public.itinerary_access(user_id, itinerary_id, access_expires_at)
  values(target_user, target_itinerary, expires_at_value)
  on conflict(user_id, itinerary_id)
  do update set access_expires_at = excluded.access_expires_at;

  return 'Acesso liberado para ' || customer_username || ' ✨';
end;
$$;

grant execute on function public.grant_itinerary_access_by_username(text, text, timestamptz)
to authenticated;

-- Garante perfil para usuários que já existiam antes do trigger.
insert into public.profiles(id, email, username, full_name)
select
  users.id,
  users.email,
  lower(coalesce(nullif(users.raw_user_meta_data->>'username', ''), split_part(users.email, '@', 1))),
  coalesce(
    nullif(users.raw_user_meta_data->>'full_name', ''),
    split_part(users.email, '@', 1)
  )
from auth.users users
on conflict(id) do update set
  email = excluded.email,
  username = coalesce(public.profiles.username, excluded.username),
  full_name = coalesce(public.profiles.full_name, excluded.full_name);
