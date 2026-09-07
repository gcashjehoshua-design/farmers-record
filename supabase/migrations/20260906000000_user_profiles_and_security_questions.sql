-- User profile names, birthdate, and security-question password recovery.
-- Apply this migration before deploying the updated Edge Functions/application.

ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS birthdate DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Preserve existing users. Legacy full names are split conservatively:
-- first word -> first name, last word -> last name, words in between -> middle name.
UPDATE public.app_users
SET first_name = COALESCE(NULLIF(first_name, ''), split_part(trim(full_name), ' ', 1)),
    last_name = COALESCE(
      NULLIF(last_name, ''),
      CASE
        WHEN array_length(regexp_split_to_array(trim(full_name), '\s+'), 1) > 1
          THEN (regexp_split_to_array(trim(full_name), '\s+'))[array_length(regexp_split_to_array(trim(full_name), '\s+'), 1)]
        ELSE split_part(trim(full_name), ' ', 1)
      END
    ),
    middle_name = COALESCE(
      middle_name,
      CASE
        WHEN array_length(regexp_split_to_array(trim(full_name), '\s+'), 1) > 2
          THEN array_to_string(
            (regexp_split_to_array(trim(full_name), '\s+'))[2:array_length(regexp_split_to_array(trim(full_name), '\s+'), 1) - 1],
            ' '
          )
        ELSE NULL
      END
    );

-- These remain nullable at database level so the currently deployed account-creation
-- RPC can insert a legacy full_name first; the application immediately fills them.

CREATE OR REPLACE FUNCTION public.sync_app_user_full_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NULLIF(trim(COALESCE(NEW.first_name, '')), '') IS NULL
     OR NULLIF(trim(COALESCE(NEW.last_name, '')), '') IS NULL THEN
    NEW.first_name := split_part(trim(NEW.full_name), ' ', 1);
    NEW.last_name := CASE
      WHEN array_length(regexp_split_to_array(trim(NEW.full_name), '\s+'), 1) > 1
        THEN (regexp_split_to_array(trim(NEW.full_name), '\s+'))[array_length(regexp_split_to_array(trim(NEW.full_name), '\s+'), 1)]
      ELSE split_part(trim(NEW.full_name), ' ', 1)
    END;
  END IF;
  NEW.first_name := trim(NEW.first_name);
  NEW.middle_name := NULLIF(trim(COALESCE(NEW.middle_name, '')), '');
  NEW.last_name := trim(NEW.last_name);
  NEW.full_name := concat_ws(' ', NEW.first_name, NEW.middle_name, NEW.last_name);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_app_user_full_name_trigger ON public.app_users;
CREATE TRIGGER sync_app_user_full_name_trigger
BEFORE INSERT OR UPDATE OF first_name, middle_name, last_name ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.sync_app_user_full_name();

CREATE OR REPLACE FUNCTION public.enforce_self_profile_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permit the administrator's one-time completion of a newly created legacy row.
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

CREATE TABLE IF NOT EXISTS public.user_security_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (char_length(trim(question)) BETWEEN 10 AND 200),
  answer_hash TEXT NOT NULL,
  answer_salt TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_security_questions ENABLE ROW LEVEL SECURITY;

-- Answers/hashes are deliberately inaccessible through the browser API.
REVOKE ALL ON public.user_security_questions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.has_security_question()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_security_questions q
    JOIN public.app_users u ON u.id = q.user_id
    WHERE u.auth_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.has_security_question() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_security_question() TO authenticated;

-- The old full_name remains as a generated compatibility field for existing code/reports.
COMMENT ON COLUMN public.app_users.full_name IS
  'Compatibility display name maintained by sync_app_user_full_name_trigger.';
