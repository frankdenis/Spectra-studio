-- Usage and billing atomicity hardening is applied through the Supabase migration API.
-- This marker keeps repository migration history aligned with the live project.
revoke execute on function public.consume_usage(uuid,text,numeric,text,jsonb) from public, anon, authenticated;
