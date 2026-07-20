drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "admins update profiles" on public.profiles;
drop policy if exists "customers read granted published itineraries" on public.itineraries;
drop policy if exists "admins manage itineraries" on public.itineraries;
drop policy if exists "users read own access" on public.itinerary_access;
drop policy if exists "admins manage access" on public.itinerary_access;
