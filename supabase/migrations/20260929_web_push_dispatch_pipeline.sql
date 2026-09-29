-- Sadiq Web Push dispatch pipeline.
-- Secrets are stored in Supabase Vault separately and are intentionally NOT committed.

create extension if not exists pg_net;

create or replace function public.get_push_public_key()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'sadiq_vapid_public_key'
  order by created_at desc
  limit 1
$$;

revoke all on function public.get_push_public_key() from public;
grant execute on function public.get_push_public_key() to anon, authenticated;

create or replace function public.get_push_server_config()
returns table (
  vapid_public_key text,
  vapid_private_key text,
  webhook_secret text,
  vapid_subject text
)
language sql
security definer
set search_path = public, vault
as $$
  select
    max(decrypted_secret) filter (where name = 'sadiq_vapid_public_key') as vapid_public_key,
    max(decrypted_secret) filter (where name = 'sadiq_vapid_private_key') as vapid_private_key,
    max(decrypted_secret) filter (where name = 'sadiq_push_webhook_secret') as webhook_secret,
    coalesce(
      max(decrypted_secret) filter (where name = 'sadiq_vapid_subject'),
      'https://sadiqh.vercel.app'
    ) as vapid_subject
  from vault.decrypted_secrets
$$;

revoke all on function public.get_push_server_config() from public, anon, authenticated;
grant execute on function public.get_push_server_config() to service_role;

create or replace function public.dispatch_sadiq_push_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net, extensions
as $$
declare
  v_secret text;
begin
  select decrypted_secret
    into v_secret
  from vault.decrypted_secrets
  where name = 'sadiq_push_webhook_secret'
  order by created_at desc
  limit 1;

  if nullif(v_secret, '') is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://mdkhklotknuseilyrvqe.supabase.co/functions/v1/push-notify-v2',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sadiq-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', tg_table_name,
      'schema', tg_table_schema,
      'record', to_jsonb(new)
    ),
    timeout_milliseconds := 5000
  );

  return new;
exception
  when others then
    raise warning 'SADIQ_PUSH_DISPATCH_FAILED: %', sqlerrm;
    return new;
end;
$$;

revoke all on function public.dispatch_sadiq_push_webhook() from public, anon, authenticated;

drop trigger if exists trg_sadiq_push_student_notifications on public.student_notifications;
create trigger trg_sadiq_push_student_notifications
after insert on public.student_notifications
for each row execute function public.dispatch_sadiq_push_webhook();

drop trigger if exists trg_sadiq_push_internal_messages on public.internal_messages;
create trigger trg_sadiq_push_internal_messages
after insert on public.internal_messages
for each row execute function public.dispatch_sadiq_push_webhook();

drop trigger if exists trg_sadiq_push_notification_recipients on public.notification_recipients;
create trigger trg_sadiq_push_notification_recipients
after insert on public.notification_recipients
for each row execute function public.dispatch_sadiq_push_webhook();
