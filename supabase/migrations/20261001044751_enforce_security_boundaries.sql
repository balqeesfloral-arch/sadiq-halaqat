-- Server-enforced account status, tenant boundaries and approval authority.
-- Existing history is preserved. New assignments require a valid student/halaqa pair.
CREATE OR REPLACE FUNCTION private.current_profile_id()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
  SELECT p.id FROM public.profiles p JOIN auth.users u ON u.id=p.auth_user_id
  WHERE p.auth_user_id=auth.uid() AND p.status='active' AND coalesce(p.is_active,true)
    AND (p.role='student' OR u.email_confirmed_at IS NOT NULL)
  LIMIT 1
$$;
CREATE OR REPLACE FUNCTION private.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
  SELECT p.role FROM public.profiles p WHERE p.id=private.current_profile_id()
$$;
CREATE OR REPLACE FUNCTION private.require_active_profile()
RETURNS bigint LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private AS $$
DECLARE v_id bigint;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NULL; END IF;
  v_id := private.current_profile_id();
  IF v_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='ACTIVE_ACCOUNT_REQUIRED';
  END IF;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION private.require_active_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.require_active_profile() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, private
AS $$ SELECT private.current_profile_id() $$;
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, private
AS $$ SELECT private.current_profile_role() $$;
CREATE OR REPLACE FUNCTION public._exam_v2_current_profile_id()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, private
AS $$ SELECT private.current_profile_id() $$;
CREATE OR REPLACE FUNCTION public.is_teacher_of_halaqa(_halaqa_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, private
AS $$ SELECT private.current_profile_role() = 'teacher' AND EXISTS (
  SELECT 1 FROM public.teacher_halaqat th
  WHERE th.halaqa_id = _halaqa_id AND th.teacher_id = private.current_profile_id()
) $$;

-- Every authenticated privileged PL/pgSQL entrypoint rejects disabled identities,
-- including legacy exam, communication, onboarding and administrative RPCs.
DO $migration$
DECLARE f record; definition text;
BEGIN
  FOR f IN
    SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    JOIN pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.prosecdef AND l.lanname='plpgsql'
      AND p.prorettype <> 'trigger'::regtype
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
      AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    definition := pg_get_functiondef(f.oid);
    IF position('PERFORM private.require_active_profile();' IN definition)=0 THEN
      definition := regexp_replace(definition, '\mBEGIN\M',
        E'BEGIN\n  PERFORM private.require_active_profile();', 'i');
      IF position('PERFORM private.require_active_profile();' IN definition)=0 THEN
        RAISE EXCEPTION 'Cannot install active-account guard: %', f.oid::regprocedure;
      END IF;
      EXECUTE definition;
    END IF;
  END LOOP;
END $migration$;

-- SQL entrypoint not covered by the PL/pgSQL guards.
CREATE OR REPLACE FUNCTION public.get_my_student_assignment_v2()
RETURNS TABLE(halaqa_id bigint,halaqa_name text,mosque_id bigint,mosque_name text,teacher_id bigint,teacher_name text)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
  SELECT h.id,h.name,m.id,m.name,coalesce(sh.teacher_id,h.main_teacher_id),tp.full_name
  FROM public.student_halaqat sh JOIN public.halaqat h ON h.id=sh.halaqa_id
  JOIN public.mosques m ON m.id=h.mosque_id
  LEFT JOIN public.profiles tp ON tp.id=coalesce(sh.teacher_id,h.main_teacher_id)
  WHERE sh.student_id=private.current_profile_id()
    AND private.current_profile_role()='student' AND sh.is_current
  ORDER BY sh.created_at DESC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.can_link_halaqa_member(p_profile_id bigint,p_halaqa_id bigint,p_member_role text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, private AS $$
DECLARE v_mosque bigint; v_profile public.profiles%rowtype;
BEGIN
  IF NOT private.can_manage_student_halaqa(p_halaqa_id) THEN RETURN false; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id=p_profile_id;
  IF v_profile.id IS NULL OR v_profile.role IS DISTINCT FROM p_member_role THEN RETURN false; END IF;
  IF private.current_profile_role()='admin' THEN RETURN true; END IF;
  SELECT mosque_id INTO v_mosque FROM public.halaqat WHERE id=p_halaqa_id;
  IF p_member_role='student' AND EXISTS (
    SELECT 1 FROM public.student_halaqat sh JOIN public.halaqat h ON h.id=sh.halaqa_id
    WHERE sh.student_id=p_profile_id AND sh.is_current AND h.mosque_id<>v_mosque
  ) THEN RETURN false; END IF;
  -- Unlinked profiles created by staff have no Auth identity. Public accounts
  -- must have applied to this halaqa; an ID alone never grants ownership.
  RETURN (v_profile.auth_user_id IS NULL AND (
      (p_member_role='student' AND NOT EXISTS (SELECT 1 FROM public.student_halaqat WHERE student_id=p_profile_id))
      OR (p_member_role='teacher' AND NOT EXISTS (SELECT 1 FROM public.teacher_halaqat WHERE teacher_id=p_profile_id))
    ))
    OR (p_member_role='student' AND EXISTS (
      SELECT 1 FROM public.student_halaqat sh JOIN public.halaqat h ON h.id=sh.halaqa_id
      WHERE sh.student_id=p_profile_id AND h.mosque_id=v_mosque
    ))
    OR (p_member_role='teacher' AND EXISTS (
      SELECT 1 FROM public.teacher_halaqat th JOIN public.halaqat h ON h.id=th.halaqa_id
      WHERE th.teacher_id=p_profile_id AND h.mosque_id=v_mosque
    ))
    OR EXISTS (SELECT 1 FROM public.portal_join_requests r
      WHERE r.applicant_id=p_profile_id AND r.applicant_role=p_member_role
        AND r.halaqa_id=p_halaqa_id AND r.status='pending');
END $$;
REVOKE ALL ON FUNCTION private.can_link_halaqa_member(bigint,bigint,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_link_halaqa_member(bigint,bigint,text) TO authenticated;
ALTER POLICY student_halaqat_insert_scoped ON public.student_halaqat
  WITH CHECK (private.can_link_halaqa_member(student_id,halaqa_id,'student'));
ALTER POLICY student_halaqat_update_scoped ON public.student_halaqat
  WITH CHECK (private.can_link_halaqa_member(student_id,halaqa_id,'student'));
ALTER POLICY teacher_halaqat_insert_scoped ON public.teacher_halaqat
  WITH CHECK (private.can_link_halaqa_member(teacher_id,halaqa_id,'teacher'));
ALTER POLICY teacher_halaqat_update_scoped ON public.teacher_halaqat
  WITH CHECK (private.can_link_halaqa_member(teacher_id,halaqa_id,'teacher'));

CREATE OR REPLACE FUNCTION private.guard_student_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  -- Serialize assignment changes for the same student, including join RPCs.
  PERFORM 1 FROM public.profiles WHERE id=NEW.student_id AND role='student' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='STUDENT_ROLE_REQUIRED'; END IF;
  IF TG_OP='UPDATE' AND NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='MEMBERSHIP_IDENTITY_IMMUTABLE';
  END IF;
  IF NEW.is_current AND EXISTS (SELECT 1 FROM public.student_halaqat sh
    WHERE sh.student_id=NEW.student_id AND sh.is_current AND sh.id<>coalesce(NEW.id,0)) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='STUDENT_ALREADY_ASSIGNED';
  END IF;
  IF NEW.teacher_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.teacher_halaqat th
    WHERE th.teacher_id=NEW.teacher_id AND th.halaqa_id=NEW.halaqa_id) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='TEACHER_OUTSIDE_HALAQA';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_student_membership() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_student_membership BEFORE INSERT OR UPDATE ON public.student_halaqat
FOR EACH ROW EXECUTE FUNCTION private.guard_student_membership();

-- Table writes must refer to a real membership, including historical records.
DO $migration$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['recitations','attendance','monthly_progress','monthly_plans','quran_student_policies','quran_assignments'] LOOP
    FOR p IN SELECT policyname,cmd FROM pg_policies WHERE schemaname='public'
      AND tablename=t AND cmd IN ('INSERT','UPDATE','ALL') LOOP
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (private.can_manage_student_record(student_id,halaqa_id))',p.policyname,t);
    END LOOP;
  END LOOP;
END $migration$;

CREATE OR REPLACE FUNCTION private.guard_monthly_plan_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
DECLARE v_role text:=private.current_profile_role(); v_changed boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  PERFORM private.require_active_profile();
  IF v_role='teacher' THEN
    IF TG_OP='INSERT' THEN
      IF NEW.status NOT IN ('draft','submitted') OR NEW.approved_by IS NOT NULL
        OR NEW.approved_at IS NOT NULL OR NEW.supervisor_note IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PLAN_APPROVAL_REQUIRES_SUPERVISOR';
      END IF;
    ELSE
      IF NEW.status IN ('approved','rejected') AND NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PLAN_APPROVAL_REQUIRES_SUPERVISOR';
      END IF;
      IF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
        OR NEW.supervisor_note IS DISTINCT FROM OLD.supervisor_note THEN
        IF NOT (NEW.status IN ('draft','submitted') AND NEW.approved_by IS NULL
          AND NEW.approved_at IS NULL AND NEW.supervisor_note IS NULL) THEN
          RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PLAN_APPROVAL_REQUIRES_SUPERVISOR';
        END IF;
      END IF;
      v_changed := (to_jsonb(NEW)-ARRAY['updated_at','submitted_at','status','approved_at','approved_by','supervisor_note'])
        IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['updated_at','submitted_at','status','approved_at','approved_by','supervisor_note']);
      IF (v_changed AND OLD.status IN ('approved','rejected')) OR NEW.status IN ('draft','submitted') THEN
        IF NEW.status IN ('approved','rejected') THEN NEW.status:='draft'; END IF;
        NEW.approved_by:=NULL; NEW.approved_at:=NULL; NEW.supervisor_note:=NULL;
      END IF;
    END IF;
  ELSIF v_role IN ('supervisor','admin') AND private.can_manage_student_record(NEW.student_id,NEW.halaqa_id) THEN
    IF NEW.status='approved' THEN NEW.approved_by:=private.current_profile_id(); NEW.approved_at:=now();
    ELSIF NEW.status IN ('draft','submitted','rejected') THEN NEW.approved_by:=NULL; NEW.approved_at:=NULL;
    END IF;
  ELSE RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PLAN_ACCESS_DENIED';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_monthly_plan_authority() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_monthly_plan_authority BEFORE INSERT OR UPDATE ON public.monthly_plans
FOR EACH ROW EXECUTE FUNCTION private.guard_monthly_plan_authority();
CREATE POLICY monthly_plans_supervisor_update ON public.monthly_plans FOR UPDATE TO authenticated
USING (private.current_profile_role() IN ('supervisor','admin') AND private.can_manage_student_record(student_id,halaqa_id))
WITH CHECK (private.current_profile_role() IN ('supervisor','admin') AND private.can_manage_student_record(student_id,halaqa_id));

-- Prevent future plaintext passwords without changing existing profile columns.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_no_plaintext_password CHECK (password_plain IS NULL);

-- Private credential material: no PIN is stored or returned by database RPCs.
CREATE TABLE private.student_login_credentials (
  student_id bigint PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_version uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.student_login_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.student_login_credentials FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.student_login_credentials TO service_role;
INSERT INTO private.student_login_credentials(student_id) SELECT id FROM public.profiles WHERE role='student';
CREATE OR REPLACE FUNCTION private.create_student_login_credential()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, private AS $$
BEGIN
  IF NEW.role='student' THEN INSERT INTO private.student_login_credentials(student_id)
    VALUES(NEW.id) ON CONFLICT(student_id) DO NOTHING; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.create_student_login_credential() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_student_login_credential AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.create_student_login_credential();

CREATE OR REPLACE FUNCTION public.student_login_context(p_user_number text)
RETURNS TABLE(student_id bigint,credential_version uuid)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
  SELECT p.id,c.credential_version FROM public.profiles p
  JOIN private.student_login_credentials c ON c.student_id=p.id
  WHERE p.user_number=p_user_number AND p.role='student' AND p.status='active' AND coalesce(p.is_active,true)
$$;
REVOKE ALL ON FUNCTION public.student_login_context(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.student_login_context(text) TO service_role;

CREATE OR REPLACE FUNCTION public.student_access_card_context(p_student_id bigint)
RETURNS TABLE(student_id bigint,full_name text,user_number text,credential_version uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
DECLARE v_me bigint:=private.require_active_profile(); v_role text:=private.current_profile_role();
BEGIN
  IF NOT (v_role='admin' OR (v_role='student' AND v_me=p_student_id)
    OR (v_role IN ('teacher','supervisor') AND EXISTS (SELECT 1 FROM public.student_halaqat sh
      WHERE sh.student_id=p_student_id AND sh.is_current AND private.can_manage_halaqa_records(sh.halaqa_id)))) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='STUDENT_CARD_ACCESS_DENIED';
  END IF;
  RETURN QUERY SELECT p.id,p.full_name,p.user_number,c.credential_version FROM public.profiles p
    JOIN private.student_login_credentials c ON c.student_id=p.id WHERE p.id=p_student_id AND p.role='student';
END $$;
REVOKE ALL ON FUNCTION public.student_access_card_context(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_access_card_context(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.rotate_student_access_card_context(p_student_id bigint)
RETURNS TABLE(student_id bigint,full_name text,user_number text,credential_version uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
BEGIN
  PERFORM 1 FROM public.student_access_card_context(p_student_id);
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='STUDENT_CARD_ACCESS_DENIED'; END IF;
  UPDATE private.student_login_credentials SET credential_version=gen_random_uuid()
    WHERE student_login_credentials.student_id=p_student_id;
  RETURN QUERY SELECT * FROM public.student_access_card_context(p_student_id);
END $$;
REVOKE ALL ON FUNCTION public.rotate_student_access_card_context(bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotate_student_access_card_context(bigint) TO authenticated;

-- Atomic counters called only by trusted Edge Functions. Keys are HMAC digests,
-- so raw IP addresses, email addresses and login codes are never stored here.
CREATE TABLE private.security_rate_limits (
  quota_key text NOT NULL, window_seconds integer NOT NULL,
  window_start timestamptz NOT NULL, attempts integer NOT NULL,
  expires_at timestamptz NOT NULL, PRIMARY KEY(quota_key,window_seconds)
);
ALTER TABLE private.security_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX security_rate_limits_expiry ON private.security_rate_limits(expires_at);
REVOKE ALL ON private.security_rate_limits FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.take_security_quota(p_key text,p_limit integer,p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, private AS $$
DECLARE v_window timestamptz; v_count integer;
BEGIN
  IF p_key !~ '^[a-z0-9:_-]{1,160}$' OR p_limit NOT BETWEEN 1 AND 5000
    OR p_window_seconds NOT BETWEEN 30 AND 86400 THEN RAISE EXCEPTION 'INVALID_QUOTA'; END IF;
  v_window:=to_timestamp(floor(extract(epoch FROM clock_timestamp())/p_window_seconds)*p_window_seconds);
  DELETE FROM private.security_rate_limits WHERE (quota_key,window_seconds) IN
    (SELECT quota_key,window_seconds FROM private.security_rate_limits WHERE expires_at<now()
      ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED);
  INSERT INTO private.security_rate_limits AS q(quota_key,window_seconds,window_start,attempts,expires_at)
    VALUES(p_key,p_window_seconds,v_window,1,v_window+make_interval(secs=>p_window_seconds))
  ON CONFLICT(quota_key,window_seconds) DO UPDATE
    SET window_start=excluded.window_start, expires_at=excluded.expires_at,
      attempts=CASE WHEN q.window_start<excluded.window_start THEN 1 ELSE q.attempts+1 END
    WHERE q.window_start<excluded.window_start OR q.attempts<p_limit
  RETURNING attempts INTO v_count;
  RETURN v_count IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.take_security_quota(text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.take_security_quota(text,integer,integer) TO service_role;

-- The public support form must pass Edge rate limiting before this RPC.
REVOKE ALL ON FUNCTION public.submit_public_support_request(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_support_request(text,text,text,text) TO service_role;
-- Serialize phone-based limits, including concurrent submissions.
DO $migration$
DECLARE definition text;
BEGIN
  definition:=pg_get_functiondef('public.submit_public_support_request(text,text,text,text)'::regprocedure);
  definition:=replace(definition, '  if exists (', E'  perform pg_advisory_xact_lock(hashtextextended(v_phone, 9042));\n\n  if exists (');
  EXECUTE definition;
END $migration$;

-- Web Push endpoint allowlist shared with workers, default HTTPS port only.
CREATE OR REPLACE FUNCTION private.valid_push_endpoint(p_endpoint text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
 SELECT length(p_endpoint) BETWEEN 30 AND 2048 AND p_endpoint ~
 '^https://(fcm\.googleapis\.com|([a-z0-9-]+\.)?push\.services\.mozilla\.com|([a-z0-9-]+\.)?push\.apple\.com|([a-z0-9-]+\.)?notify\.windows\.com)(:443)?/[^[:space:]#]+$'
$$;
REVOKE ALL ON FUNCTION private.valid_push_endpoint(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.valid_push_endpoint(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.save_my_push_subscription(p_endpoint text,p_p256dh text,p_auth text,p_user_agent text DEFAULT NULL,p_device_label text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, private AS $$
DECLARE v_user uuid:=auth.uid(); v_id bigint;
BEGIN
  PERFORM private.require_active_profile();
  IF v_user IS NULL OR NOT private.valid_push_endpoint(p_endpoint)
    OR p_p256dh !~ '^[A-Za-z0-9_-]{87}=?$' OR p_auth !~ '^[A-Za-z0-9_-]{22}={0,2}$'
    OR p_p256dh IS NULL OR p_auth IS NULL OR p_endpoint IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='INVALID_PUSH_SUBSCRIPTION';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text,9043));
  IF EXISTS(SELECT 1 FROM public.push_subscriptions WHERE endpoint=p_endpoint AND auth_user_id<>v_user) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PUSH_ENDPOINT_OWNED_BY_ANOTHER_ACCOUNT';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.push_subscriptions WHERE endpoint=p_endpoint AND auth_user_id=v_user)
    AND (SELECT count(*) FROM public.push_subscriptions WHERE auth_user_id=v_user AND is_active)>=10 THEN
    RAISE EXCEPTION USING ERRCODE='54000', MESSAGE='PUSH_DEVICE_LIMIT';
  END IF;
  INSERT INTO public.push_subscriptions AS s(auth_user_id,endpoint,p256dh,auth,user_agent,device_label,is_active,last_seen_at,updated_at)
  VALUES(v_user,p_endpoint,p_p256dh,p_auth,left(p_user_agent,512),left(p_device_label,120),true,now(),now())
  ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh,auth=excluded.auth,
    user_agent=excluded.user_agent,device_label=excluded.device_label,is_active=true,last_seen_at=now(),updated_at=now()
    WHERE s.auth_user_id=v_user
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PUSH_ENDPOINT_OWNED_BY_ANOTHER_ACCOUNT'; END IF;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.save_my_push_subscription(text,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_my_push_subscription(text,text,text,text,text) TO authenticated;
