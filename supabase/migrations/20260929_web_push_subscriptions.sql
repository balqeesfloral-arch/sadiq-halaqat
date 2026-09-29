-- Sadiq Web Push subscriptions
-- Stores only Web Push public subscription material. No biometric data is stored.

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device_label text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_auth_user_id_idx
  on public.push_subscriptions (auth_user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions
  for delete
  to authenticated
  using (auth_user_id = auth.uid());

revoke all on table public.push_subscriptions from anon;
grant select, delete on table public.push_subscriptions to authenticated;

create or replace function public.save_my_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default null,
  p_device_label text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_id bigint;
begin
  if v_auth_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if nullif(trim(p_endpoint), '') is null
     or nullif(trim(p_p256dh), '') is null
     or nullif(trim(p_auth), '') is null then
    raise exception 'INVALID_PUSH_SUBSCRIPTION';
  end if;

  insert into public.push_subscriptions (
    auth_user_id,
    endpoint,
    p256dh,
    auth,
    user_agent,
    device_label,
    is_active,
    last_seen_at,
    updated_at
  )
  values (
    v_auth_user_id,
    p_endpoint,
    p_p256dh,
    p_auth,
    nullif(trim(coalesce(p_user_agent, '')), ''),
    nullif(trim(coalesce(p_device_label, '')), ''),
    true,
    now(),
    now()
  )
  on conflict (endpoint) do update
    set auth_user_id = excluded.auth_user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        device_label = excluded.device_label,
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.remove_my_push_subscription(
  p_endpoint text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_deleted integer;
begin
  if v_auth_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  delete from public.push_subscriptions
  where auth_user_id = v_auth_user_id
    and endpoint = p_endpoint;

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function public.save_my_push_subscription(text,text,text,text,text) from public;
revoke all on function public.remove_my_push_subscription(text) from public;
grant execute on function public.save_my_push_subscription(text,text,text,text,text) to authenticated;
grant execute on function public.remove_my_push_subscription(text) to authenticated;

comment on table public.push_subscriptions is
  'Web Push subscriptions owned by authenticated users. Stores endpoint and Web Push public keys only.';
