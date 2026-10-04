-- Spectra Studio admin bootstrap
-- Run through the Supabase SQL editor with an authorized project owner context.
-- The application already uses VITE_ADMIN_EMAILS/SPECTRA_ADMIN_EMAILS for the UI/API.
-- This migration aligns database RLS with that administrator identity.

update public.profiles p
set role='admin', updated_at=now()
from auth.users u
where p.id=u.id
  and lower(u.email)=lower('frankden607@gmail.com');

insert into public.user_limits (
  user_id, plan, unlimited, max_rooms, max_participants,
  monthly_ai_minutes, monthly_avatar_minutes, monthly_voice_minutes,
  max_recording_minutes, max_storage_mb, updated_at
)
select p.id,'admin',true,2147483647,100,2147483647,2147483647,2147483647,2147483647,2147483647,now()
from public.profiles p
join auth.users u on u.id=p.id
where lower(u.email)=lower('frankden607@gmail.com')
on conflict (user_id) do update set
  plan=excluded.plan,
  unlimited=true,
  max_rooms=excluded.max_rooms,
  max_participants=excluded.max_participants,
  monthly_ai_minutes=excluded.monthly_ai_minutes,
  monthly_avatar_minutes=excluded.monthly_avatar_minutes,
  monthly_voice_minutes=excluded.monthly_voice_minutes,
  max_recording_minutes=excluded.max_recording_minutes,
  max_storage_mb=excluded.max_storage_mb,
  updated_at=now();
