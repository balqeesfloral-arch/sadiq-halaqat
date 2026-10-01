-- Run in a transaction; this script always rolls back its fixtures and changes.
BEGIN;
CREATE TEMP TABLE security_test_results(name text PRIMARY KEY,passed boolean NOT NULL);
DO $tests$
DECLARE t record; s record; student_actor record; plan_id bigint; recitation_id bigint; old_version uuid; new_version uuid;
  foreign_halaqa bigint; foreign_mosque bigint; denied boolean; n bigint; old_endpoint text;
  statuses text[]:=ARRAY['status','is_active']; flag text;
BEGIN
  SELECT p.id,p.auth_user_id,th.halaqa_id INTO t FROM public.profiles p
    JOIN public.teacher_halaqat th ON th.teacher_id=p.id
    WHERE p.role='teacher' AND p.status='active' AND p.auth_user_id IS NOT NULL
      AND EXISTS(SELECT 1 FROM public.monthly_plans mp WHERE mp.halaqa_id=th.halaqa_id)
    ORDER BY p.id,th.id LIMIT 1;
  SELECT p.id,p.auth_user_id,h.id halaqa_id,h.mosque_id INTO s FROM public.profiles p
    JOIN public.mosque_supervisors ms ON ms.supervisor_id=p.id
    JOIN public.halaqat h ON h.mosque_id=ms.mosque_id
    WHERE p.role='supervisor' AND p.status='active' AND p.auth_user_id IS NOT NULL
      AND h.id=t.halaqa_id ORDER BY p.id LIMIT 1;
  SELECT p.id,p.auth_user_id INTO student_actor FROM public.profiles p
    JOIN public.student_halaqat sh ON sh.student_id=p.id
    WHERE p.role='student' AND p.auth_user_id IS NOT NULL AND sh.halaqa_id=t.halaqa_id AND sh.is_current
    ORDER BY p.id LIMIT 1;
  IF t.id IS NULL OR s.id IS NULL OR student_actor.id IS NULL THEN RAISE EXCEPTION 'TEST_ACTORS_UNAVAILABLE'; END IF;
  SELECT id INTO plan_id FROM public.monthly_plans WHERE halaqa_id=t.halaqa_id ORDER BY id LIMIT 1;
  SELECT id INTO recitation_id FROM public.recitations WHERE halaqa_id=t.halaqa_id ORDER BY id LIMIT 1;

  FOREACH flag IN ARRAY statuses LOOP
    BEGIN
      PERFORM set_config('request.jwt.claims','{}',true); PERFORM set_config('request.jwt.claim.sub','',true);
      IF flag='status' THEN UPDATE public.profiles SET status='inactive' WHERE id=t.id;
      ELSE UPDATE public.profiles SET is_active=false WHERE id=t.id; END IF;
      PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',t.auth_user_id,'role','authenticated')::text,true);
      PERFORM set_config('request.jwt.claim.sub',t.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
      IF public.current_profile_id() IS NOT NULL OR public.is_teacher_of_halaqa(t.halaqa_id) IS TRUE THEN RAISE EXCEPTION 'DISABLED_ACTOR_HELPER_BYPASS'; END IF;
      SELECT count(*) INTO n FROM public.monthly_plans; IF n<>0 THEN RAISE EXCEPTION 'DISABLED_ACTOR_PLAN_READ'; END IF;
      UPDATE public.monthly_plans SET notes='rolled-back security test' WHERE id=plan_id;
      GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'DISABLED_ACTOR_PLAN_WRITE'; END IF;
      denied:=false;
      BEGIN PERFORM public.teacher_exam_dashboard_v2(); EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
      IF NOT denied THEN RAISE EXCEPTION 'DISABLED_ACTOR_EXAM_RPC'; END IF;
      RAISE EXCEPTION USING ERRCODE='PZ001',MESSAGE='ROLLBACK_TEST';
    EXCEPTION WHEN SQLSTATE 'PZ001' THEN NULL; END;
    INSERT INTO security_test_results VALUES('disabled_teacher_'||flag,true);
  END LOOP;
  BEGIN
    PERFORM set_config('request.jwt.claims','{}',true); PERFORM set_config('request.jwt.claim.sub','',true);
    UPDATE public.profiles SET is_active=false WHERE id=s.id;
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',s.auth_user_id,'role','authenticated')::text,true);
    PERFORM set_config('request.jwt.claim.sub',s.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
    denied:=false;
    BEGIN PERFORM public.get_supervisor_communication_directory(); EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
    IF NOT denied THEN RAISE EXCEPTION 'DISABLED_SUPERVISOR_CONTACTS'; END IF;
    RAISE EXCEPTION USING ERRCODE='PZ001',MESSAGE='ROLLBACK_TEST';
  EXCEPTION WHEN SQLSTATE 'PZ001' THEN NULL; END;
  INSERT INTO security_test_results VALUES('disabled_supervisor_directory',true);

  BEGIN
    PERFORM set_config('request.jwt.claims','{}',true); PERFORM set_config('request.jwt.claim.sub','',true);
    UPDATE auth.users SET email_confirmed_at=NULL WHERE id=t.auth_user_id;
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',t.auth_user_id,'role','authenticated')::text,true);
    PERFORM set_config('request.jwt.claim.sub',t.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
    IF public.current_profile_id() IS NOT NULL THEN RAISE EXCEPTION 'UNVERIFIED_STAFF_BYPASS'; END IF;
    denied:=false;
    BEGIN PERFORM public.get_my_teacher_assignments(); EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
    IF NOT denied THEN RAISE EXCEPTION 'UNVERIFIED_STAFF_RPC_BYPASS'; END IF;
    RAISE EXCEPTION USING ERRCODE='PZ001',MESSAGE='ROLLBACK_TEST';
  EXCEPTION WHEN SQLSTATE 'PZ001' THEN NULL; END;
  INSERT INTO security_test_results VALUES('unverified_staff_has_no_access',true);

  INSERT INTO public.mosques(id,name,status) OVERRIDING SYSTEM VALUE VALUES(-910000005,'Security test mosque','active');
  INSERT INTO public.halaqat(id,mosque_id,name,status) OVERRIDING SYSTEM VALUE VALUES(-910000004,-910000005,'Security test halaqa','active');
  INSERT INTO public.profiles(id,role,user_number,full_name,status,is_active) OVERRIDING SYSTEM VALUE
    VALUES(-910000003,'student','SECURITY-BOUNDARY-FIXTURE','Security test student','active',true);
  INSERT INTO public.student_halaqat(id,student_id,halaqa_id,is_current) OVERRIDING SYSTEM VALUE
    VALUES(-910000002,-910000003,-910000004,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',s.auth_user_id,'role','authenticated')::text,true);
  PERFORM set_config('request.jwt.claim.sub',s.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
  denied:=false;
  BEGIN
    INSERT INTO public.student_halaqat(id,student_id,halaqa_id,is_current) OVERRIDING SYSTEM VALUE
      VALUES(-910000001,-910000003,s.halaqa_id,false);
  EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'CROSS_MOSQUE_MEMBERSHIP_BYPASS'; END IF;
  SELECT count(*) INTO n FROM public.profiles WHERE id=-910000003;
  IF n<>0 THEN RAISE EXCEPTION 'FOREIGN_STUDENT_PROFILE_LEAK'; END IF;
  EXECUTE 'RESET ROLE';
  INSERT INTO security_test_results VALUES('foreign_enrollment_and_profile_read_denied',true);

  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',t.auth_user_id,'role','authenticated')::text,true);
  PERFORM set_config('request.jwt.claim.sub',t.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
  denied:=false;
  BEGIN UPDATE public.recitations SET student_id=-910000003 WHERE id=recitation_id;
    EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
  IF recitation_id IS NULL OR NOT denied THEN RAISE EXCEPTION 'RECITATION_STUDENT_SCOPE_BYPASS'; END IF;
  denied:=false;
  BEGIN UPDATE public.monthly_plans SET status='approved',approved_by=t.id,approved_at=now() WHERE id=plan_id;
    EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'TEACHER_SELF_APPROVAL'; END IF;
  UPDATE public.monthly_plans SET status='draft',approved_by=NULL,approved_at=NULL,supervisor_note=NULL,
    notes='valid teacher edit, rolled back' WHERE id=plan_id;
  GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'VALID_TEACHER_EDIT_BLOCKED'; END IF;
  SELECT count(*) INTO n FROM public.student_access_card_context(student_actor.id);
  IF n<>1 THEN RAISE EXCEPTION 'OWN_STUDENT_CARD_BLOCKED'; END IF;
  SELECT credential_version INTO old_version FROM public.student_access_card_context(student_actor.id);
  SELECT credential_version INTO new_version FROM public.rotate_student_access_card_context(student_actor.id);
  IF old_version IS NOT DISTINCT FROM new_version THEN RAISE EXCEPTION 'CARD_ROTATION_FAILED'; END IF;
  denied:=false;
  BEGIN PERFORM public.student_access_card_context(-910000003); EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FOREIGN_STUDENT_CARD_LEAK'; END IF;
  EXECUTE 'RESET ROLE';
  INSERT INTO security_test_results VALUES('foreign_record_attribution_denied',true),('teacher_self_approval_denied',true),('card_rotation',true),
    ('valid_teacher_draft_edit',true),('teacher_card_scope',true);

  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',s.auth_user_id,'role','authenticated')::text,true);
  PERFORM set_config('request.jwt.claim.sub',s.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
  UPDATE public.monthly_plans SET status='approved',approved_by=t.id WHERE id=plan_id;
  SELECT count(*) INTO n FROM public.monthly_plans WHERE id=plan_id AND approved_by=s.id AND approved_at IS NOT NULL;
  IF n<>1 THEN RAISE EXCEPTION 'SUPERVISOR_APPROVAL_BLOCKED_OR_SPOOFED'; END IF;
  EXECUTE 'RESET ROLE';
  INSERT INTO security_test_results VALUES('supervisor_approval_with_server_identity',true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',t.auth_user_id,'role','authenticated')::text,true);
  PERFORM set_config('request.jwt.claim.sub',t.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
  UPDATE public.monthly_plans SET notes='changed approved plan, rolled back' WHERE id=plan_id;
  SELECT count(*) INTO n FROM public.monthly_plans WHERE id=plan_id AND status='draft' AND approved_by IS NULL AND approved_at IS NULL;
  IF n<>1 THEN RAISE EXCEPTION 'EDIT_KEPT_STALE_APPROVAL'; END IF;
  denied:=false;
  BEGIN PERFORM public.save_my_push_subscription('https://127.0.0.1/private',repeat('a',87),repeat('b',22));
    EXCEPTION WHEN SQLSTATE '22023' THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'PRIVATE_PUSH_ENDPOINT_ACCEPTED'; END IF;
  EXECUTE 'RESET ROLE';
  SELECT endpoint INTO old_endpoint FROM public.push_subscriptions WHERE auth_user_id<>t.auth_user_id LIMIT 1;
  IF old_endpoint IS NULL THEN RAISE EXCEPTION 'PUSH_OWNERSHIP_FIXTURE_UNAVAILABLE'; END IF;
  EXECUTE 'SET LOCAL ROLE authenticated'; denied:=false;
  BEGIN PERFORM public.save_my_push_subscription(old_endpoint,repeat('a',87),repeat('b',22));
    EXCEPTION WHEN SQLSTATE '42501' THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'PUSH_ENDPOINT_TAKEOVER'; END IF;
  EXECUTE 'RESET ROLE';
  INSERT INTO security_test_results VALUES('changed_plan_requires_reapproval',true),('push_private_destination_denied',true),('push_cross_account_reassignment_denied',true);

  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',student_actor.auth_user_id,'role','authenticated')::text,true);
  PERFORM set_config('request.jwt.claim.sub',student_actor.auth_user_id::text,true); EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM public.student_access_card_context(student_actor.id);
  IF n<>1 THEN RAISE EXCEPTION 'STUDENT_OWN_CARD_BLOCKED'; END IF;
  EXECUTE 'RESET ROLE';
  INSERT INTO security_test_results VALUES('student_own_card',true);
  IF has_function_privilege('anon','public.submit_public_support_request(text,text,text,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.take_security_quota(text,integer,integer)','EXECUTE')
    OR has_function_privilege('authenticated','public.student_login_context(text)','EXECUTE') THEN RAISE EXCEPTION 'PRIVATE_RPC_EXPOSED'; END IF;
  IF NOT public.take_security_quota('test:rollback-quota',2,600)
    OR NOT public.take_security_quota('test:rollback-quota',2,600)
    OR public.take_security_quota('test:rollback-quota',2,600) THEN RAISE EXCEPTION 'QUOTA_NOT_ENFORCED'; END IF;
  INSERT INTO security_test_results VALUES('private_rpc_execute_grants',true),('atomic_quota_limit',true);
END $tests$;
SELECT jsonb_build_object('passed',count(*),'failed',count(*) FILTER(WHERE NOT passed),'fixtures_rolled_back',true)
  AS security_results FROM security_test_results;
ROLLBACK;
