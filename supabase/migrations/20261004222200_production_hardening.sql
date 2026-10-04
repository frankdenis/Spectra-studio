-- Spectra Studio production hardening
-- Keeps privileged admin checks non-callable through the Data API and improves RLS planning.

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_admin() from authenticated;

-- Authenticated-only ownership policies.
drop policy if exists "rooms_owner_access" on public.rooms;
create policy "rooms_owner_access" on public.rooms for all to authenticated
using ((select auth.uid()) = owner_id or public.is_admin())
with check ((select auth.uid()) = owner_id or public.is_admin());

drop policy if exists "projects_owner_access" on public.projects;
create policy "projects_owner_access" on public.projects for all to authenticated
using ((select auth.uid()) = owner_id or public.is_admin())
with check ((select auth.uid()) = owner_id or public.is_admin());

drop policy if exists "generations_owner_access" on public.generations;
create policy "generations_owner_access" on public.generations for all to authenticated
using ((select auth.uid()) = owner_id or public.is_admin())
with check ((select auth.uid()) = owner_id or public.is_admin());

drop policy if exists "call_sessions_owner_access" on public.call_sessions;
drop policy if exists "calls_owner_access" on public.call_sessions;
create policy "calls_owner_access" on public.call_sessions for all to authenticated
using ((select auth.uid()) = owner_id or public.is_admin())
with check ((select auth.uid()) = owner_id or public.is_admin());

drop policy if exists "ai_identities_owner_access" on public.ai_identities;
drop policy if exists "identities_owner_access" on public.ai_identities;
create policy "identities_owner_access" on public.ai_identities for all to authenticated
using ((select auth.uid()) = owner_id or public.is_admin())
with check ((select auth.uid()) = owner_id or public.is_admin());

drop policy if exists "voice_models_owner_access" on public.voice_models;
drop policy if exists "voices_owner_access" on public.voice_models;
create policy "voices_owner_access" on public.voice_models for all to authenticated
using ((select auth.uid()) = owner_id or public.is_admin())
with check ((select auth.uid()) = owner_id or public.is_admin());

drop policy if exists "notifications_owner_access" on public.notifications;
create policy "notifications_owner_access" on public.notifications for all to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "user_settings_owner_access" on public.user_settings;
drop policy if exists "settings_owner_access" on public.user_settings;
create policy "settings_owner_access" on public.user_settings for all to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

-- Split admin policies so admin write rules do not create duplicate SELECT policies.
drop policy if exists "limits_admin_write" on public.user_limits;
create policy "limits_admin_insert" on public.user_limits for insert to authenticated with check (public.is_admin());
create policy "limits_admin_update" on public.user_limits for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "limits_admin_delete" on public.user_limits for delete to authenticated using (public.is_admin());

drop policy if exists "plans_admin_write" on public.subscription_plans;
create policy "plans_admin_insert" on public.subscription_plans for insert to authenticated with check (public.is_admin());
create policy "plans_admin_update" on public.subscription_plans for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "plans_admin_delete" on public.subscription_plans for delete to authenticated using (public.is_admin());

drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_insert" on public.subscriptions for insert to authenticated with check (public.is_admin());
create policy "subscriptions_admin_update" on public.subscriptions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "subscriptions_admin_delete" on public.subscriptions for delete to authenticated using (public.is_admin());

drop policy if exists "payments_admin_write" on public.payment_transactions;
create policy "payments_admin_insert" on public.payment_transactions for insert to authenticated with check (public.is_admin());
create policy "payments_admin_update" on public.payment_transactions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "payments_admin_delete" on public.payment_transactions for delete to authenticated using (public.is_admin());

drop policy if exists "usage_admin_write" on public.usage_counters;
create policy "usage_admin_insert" on public.usage_counters for insert to authenticated with check (public.is_admin());
create policy "usage_admin_update" on public.usage_counters for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "usage_admin_delete" on public.usage_counters for delete to authenticated using (public.is_admin());

insert into storage.buckets (id,name,public)
values ('media-assets','media-assets',false)
on conflict (id) do nothing;

drop policy if exists "media_upload_own" on storage.objects;
create policy "media_upload_own" on storage.objects for insert to authenticated
with check (bucket_id='media-assets' and (storage.foldername(name))[1]=(select auth.uid()::text));

drop policy if exists "media_read_own" on storage.objects;
create policy "media_read_own" on storage.objects for select to authenticated
using (bucket_id='media-assets' and ((storage.foldername(name))[1]=(select auth.uid()::text) or public.is_admin()));

drop policy if exists "media_delete_own" on storage.objects;
create policy "media_delete_own" on storage.objects for delete to authenticated
using (bucket_id='media-assets' and ((storage.foldername(name))[1]=(select auth.uid()::text) or public.is_admin()));
