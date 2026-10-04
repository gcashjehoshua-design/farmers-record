-- Prevent browser clients from changing account identity fields or elevating
-- their own privileges. RLS chooses which rows may be updated; this trigger
-- restricts which values may change in those rows.
CREATE OR REPLACE FUNCTION public.enforce_self_profile_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_is_admin boolean := false;
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
     OR NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Account identity fields cannot be changed';
  END IF;

  IF auth.uid() = OLD.auth_user_id THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Users cannot change their own role or account status';
    END IF;
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  ) INTO actor_is_admin;

  IF NOT actor_is_admin THEN
    RAISE EXCEPTION 'Only an active administrator can update another account';
  END IF;

  -- The admin account-creation flow creates the auth/app row first, then
  -- immediately fills these structured fields. Keep only that initialization
  -- exception; established personal profiles remain owner-editable only.
  IF OLD.first_name IS NULL
     AND OLD.last_name IS NULL
     AND OLD.birthdate IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.first_name IS DISTINCT FROM OLD.first_name
     OR NEW.middle_name IS DISTINCT FROM OLD.middle_name
     OR NEW.last_name IS DISTINCT FROM OLD.last_name
     OR NEW.birthdate IS DISTINCT FROM OLD.birthdate
     OR NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    RAISE EXCEPTION 'Only the account owner can edit personal profile details';
  END IF;

  RETURN NEW;
END;
$$;

-- Protect account lifecycle operations independently of any RPC or Edge
-- Function implementation. This closes legacy SECURITY DEFINER functions that
-- may otherwise be callable directly by anon or non-admin users.
CREATE OR REPLACE FUNCTION public.enforce_app_user_admin_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_is_admin boolean := false;
BEGIN
  IF auth.role() = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  ) INTO actor_is_admin;

  IF NOT actor_is_admin THEN
    RAISE EXCEPTION 'Only an active administrator can create or delete accounts';
  END IF;

  IF TG_OP = 'DELETE' AND OLD.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'The administrator cannot delete their own account';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_app_user_admin_insert_trigger ON public.app_users;
CREATE TRIGGER enforce_app_user_admin_insert_trigger
BEFORE INSERT ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.enforce_app_user_admin_mutations();

DROP TRIGGER IF EXISTS enforce_app_user_admin_delete_trigger ON public.app_users;
CREATE TRIGGER enforce_app_user_admin_delete_trigger
BEFORE DELETE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.enforce_app_user_admin_mutations();

-- Legacy RPCs must never be callable by signed-out visitors. The table trigger
-- above remains the authoritative role check for authenticated callers.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('admin_create_user', 'admin_delete_user')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END;
$$;
