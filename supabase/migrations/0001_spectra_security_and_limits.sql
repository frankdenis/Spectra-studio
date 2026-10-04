-- Spectra Studio production authorization model.
-- Apply this migration only to the dedicated Spectra Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','enterprise','admin')),
  unlimited boolean not null default false,
  max_rooms integer not null default 3,
  max_participants integer not null default 4,
  monthly_ai_minutes integer not null default 60,
  monthly_avatar_minutes integer not null default 15,
  monthly_voice_minutes integer not null default 15,
  max_recording_minutes integer not null default 30,
  max_storage_mb integer not null default 1024,
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status text not null default 'created' check (status in ('created','waiting','connecting','connected','ai_listening','ai_thinking','ai_speaking','ending','ended')),
  provider_room_id text,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('avatar_source','avatar_output','voice_source','voice_model','recording','transcript')),
  storage_path text not null,
  provider text,
  provider_asset_id text,
  processing_status text not null default 'queued' check (processing_status in ('queued','processing','ready','failed','deleted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  insert into public.user_limits (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_limits enable row level security;
alter table public.rooms enable row level security;
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_self_read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_self_update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "limits_self_read" on public.user_limits for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "limits_admin_write" on public.user_limits for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "rooms_owner_access" on public.rooms for all to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

create policy "media_owner_access" on public.media_assets for all to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

create policy "audit_admin_read" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "audit_authenticated_insert" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());

create index if not exists rooms_owner_id_idx on public.rooms(owner_id);
create index if not exists media_assets_owner_id_idx on public.media_assets(owner_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);


insert into storage.buckets (id, name, public)
values ('identity-assets', 'identity-assets', false)
on conflict (id) do nothing;

create policy "identity_upload_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'identity-assets' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "identity_read_own" on storage.objects
for select to authenticated
using (bucket_id = 'identity-assets' and ((storage.foldername(name))[1] = (select auth.uid()::text) or public.is_admin()));

create policy "identity_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'identity-assets' and ((storage.foldername(name))[1] = (select auth.uid()::text) or public.is_admin()));
