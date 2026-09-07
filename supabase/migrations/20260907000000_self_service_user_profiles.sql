-- Follow-up for databases that already applied the original user-profile migration.

ALTER TABLE public.user_security_questions
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.enforce_self_profile_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow one-time completion immediately after an administrator creates an account
  -- through the legacy admin_create_user RPC.
  IF OLD.first_name IS NULL AND OLD.last_name IS NULL AND OLD.birthdate IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS DISTINCT FROM OLD.auth_user_id AND (
    NEW.first_name IS DISTINCT FROM OLD.first_name OR
    NEW.middle_name IS DISTINCT FROM OLD.middle_name OR
    NEW.last_name IS DISTINCT FROM OLD.last_name OR
    NEW.birthdate IS DISTINCT FROM OLD.birthdate OR
    NEW.full_name IS DISTINCT FROM OLD.full_name
  ) THEN
    RAISE EXCEPTION 'Only the account owner can edit personal profile details';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_self_profile_edits_trigger ON public.app_users;
CREATE TRIGGER enforce_self_profile_edits_trigger
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.enforce_self_profile_edits();

