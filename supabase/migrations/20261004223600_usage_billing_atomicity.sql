-- Usage, billing and audit hardening
-- Applied to the production Supabase project before this migration was committed.

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null unique,
  kind text not null check (kind in ('ai','avatar','voice','storage','room')),
  units numeric(12,2) not null check (units > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

drop policy if exists "users_read_own_usage_events" on public.usage_events;
create policy "users_read_own_usage_events"
on public.usage_events for select
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists usage_events_user_created_idx
on public.usage_events(user_id, created_at desc);

create or replace function public.consume_usage(
  p_user_id uuid, p_kind text, p_units numeric,
  p_event_key text, p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_limit public.user_limits%rowtype;
  v_period date := date_trunc('month', now())::date;
  v_current numeric := 0;
  v_limit_value numeric := 0;
begin
  if p_user_id is null or p_units is null or p_units <= 0
     or p_event_key is null or length(trim(p_event_key)) < 8 then
    raise exception 'Invalid usage request';
  end if;
  if p_kind not in ('ai','avatar','voice','storage','room') then
    raise exception 'Unsupported usage kind';
  end if;

  if exists (select 1 from public.usage_events where event_key = p_event_key) then
    return jsonb_build_object('accepted', true, 'duplicate', true);
  end if;

  select * into v_limit from public.user_limits where user_id = p_user_id for update;
  if not found then raise exception 'Usage limits not found'; end if;

  if p_kind = 'ai' then
    v_limit_value := v_limit.monthly_ai_minutes;
    insert into public.usage_counters(user_id,period_start,ai_minutes)
    values(p_user_id,v_period,p_units)
    on conflict(user_id,period_start) do update
      set ai_minutes=public.usage_counters.ai_minutes+excluded.ai_minutes,updated_at=now()
    returning ai_minutes into v_current;
  elsif p_kind = 'avatar' then
    v_limit_value := v_limit.monthly_avatar_minutes;
    insert into public.usage_counters(user_id,period_start,avatar_minutes)
    values(p_user_id,v_period,p_units)
    on conflict(user_id,period_start) do update
      set avatar_minutes=public.usage_counters.avatar_minutes+excluded.avatar_minutes,updated_at=now()
    returning avatar_minutes into v_current;
  elsif p_kind = 'voice' then
    v_limit_value := v_limit.monthly_voice_minutes;
    insert into public.usage_counters(user_id,period_start,voice_minutes)
    values(p_user_id,v_period,p_units)
    on conflict(user_id,period_start) do update
      set voice_minutes=public.usage_counters.voice_minutes+excluded.voice_minutes,updated_at=now()
    returning voice_minutes into v_current;
  elsif p_kind = 'storage' then
    v_limit_value := v_limit.max_storage_mb;
    insert into public.usage_counters(user_id,period_start,storage_mb)
    values(p_user_id,v_period,p_units)
    on conflict(user_id,period_start) do update
      set storage_mb=public.usage_counters.storage_mb+excluded.storage_mb,updated_at=now()
    returning storage_mb into v_current;
  else
    v_limit_value := v_limit.max_rooms;
    insert into public.usage_counters(user_id,period_start,rooms_created)
    values(p_user_id,v_period,p_units)
    on conflict(user_id,period_start) do update
      set rooms_created=public.usage_counters.rooms_created+excluded.rooms_created,updated_at=now()
    returning rooms_created into v_current;
  end if;

  if not v_limit.unlimited and v_current > v_limit_value then
    delete from public.usage_counters where user_id=p_user_id and period_start=v_period;
    raise exception 'Usage limit exceeded';
  end if;

  insert into public.usage_events(user_id,event_key,kind,units,metadata)
  values(p_user_id,p_event_key,p_kind,p_units,coalesce(p_metadata,'{}'::jsonb));

  insert into public.audit_logs(actor_id,action,target_type,target_id,metadata)
  values(p_user_id,'usage.consumed','usage',p_event_key,
         jsonb_build_object('kind',p_kind,'units',p_units));

  return jsonb_build_object('accepted',true,'duplicate',false,'period_start',v_period,
    'kind',p_kind,'used',v_current,'limit',v_limit_value,'unlimited',v_limit.unlimited);
end;
$$;

revoke execute on function public.consume_usage(uuid,text,numeric,text,jsonb)
from public, anon, authenticated;

create or replace function public.activate_subscription(
  p_user_id uuid, p_plan_id text, p_provider text,
  p_provider_customer_id text, p_provider_subscription_id text,
  p_period_start timestamptz, p_period_end timestamptz
)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_plan public.subscription_plans%rowtype;
  v_subscription public.subscriptions%rowtype;
begin
  select * into v_plan from public.subscription_plans
  where id=p_plan_id and active=true;
  if not found then raise exception 'Subscription plan not found or inactive'; end if;

  insert into public.subscriptions(
    user_id,plan_id,status,provider,provider_customer_id,provider_subscription_id,
    current_period_start,current_period_end)
  values(p_user_id,p_plan_id,'active',p_provider,p_provider_customer_id,
         p_provider_subscription_id,p_period_start,p_period_end)
  on conflict(provider,provider_subscription_id) do update set
    plan_id=excluded.plan_id,status='active',
    provider_customer_id=excluded.provider_customer_id,
    current_period_start=excluded.current_period_start,
    current_period_end=excluded.current_period_end,updated_at=now()
  returning * into v_subscription;

  insert into public.user_limits(
    user_id,plan,unlimited,max_rooms,max_participants,monthly_ai_minutes,
    monthly_avatar_minutes,monthly_voice_minutes,max_recording_minutes,max_storage_mb,updated_at)
  values(p_user_id,p_plan_id,false,v_plan.max_rooms,v_plan.max_participants,
    v_plan.monthly_ai_minutes,v_plan.monthly_avatar_minutes,v_plan.monthly_voice_minutes,
    v_plan.max_recording_minutes,v_plan.max_storage_mb,now())
  on conflict(user_id) do update set
    plan=excluded.plan,unlimited=false,max_rooms=excluded.max_rooms,
    max_participants=excluded.max_participants,monthly_ai_minutes=excluded.monthly_ai_minutes,
    monthly_avatar_minutes=excluded.monthly_avatar_minutes,
    monthly_voice_minutes=excluded.monthly_voice_minutes,
    max_recording_minutes=excluded.max_recording_minutes,
    max_storage_mb=excluded.max_storage_mb,updated_at=now();

  insert into public.audit_logs(actor_id,action,target_type,target_id,metadata)
  values(p_user_id,'subscription.activated','subscription',v_subscription.id::text,
    jsonb_build_object('plan_id',p_plan_id,'provider',p_provider));

  return jsonb_build_object('subscription_id',v_subscription.id,'plan_id',p_plan_id,'status','active');
end;
$$;

revoke execute on function public.activate_subscription(uuid,text,text,text,text,timestamptz,timestamptz)
from public, anon, authenticated;
