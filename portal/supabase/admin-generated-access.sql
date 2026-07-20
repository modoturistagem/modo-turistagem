-- Execute este arquivo depois de portal/supabase/schema.sql.
-- Ele adapta o portal para acessos criados somente pela administradora.

alter table public.profiles
  add column if not exists username text;

update public.profiles
set username = lower(split_part(email, '@', 1))
where username is null
  and email is not null;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

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

  select id
  into target_user
  from public.profiles
  where lower(username) = lower(trim(customer_username))
  limit 1;

  if target_user is null then
    raise exception 'Usuário não encontrado.';
  end if;

  select id
  into target_itinerary
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
