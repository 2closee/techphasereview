-- Normalize a Nigerian-style phone to a comparable form (digits only, local 0-prefixed)
CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p IS NULL THEN NULL
    WHEN regexp_replace(p, '\D', '', 'g') = '' THEN NULL
    WHEN length(regexp_replace(p, '\D', '', 'g')) > 10
      THEN right(regexp_replace(p, '\D', '', 'g'), 10)
    ELSE regexp_replace(p, '\D', '', 'g')
  END
$$;

CREATE INDEX IF NOT EXISTS idx_student_registrations_email_lower
  ON public.student_registrations (lower(btrim(email)));

CREATE INDEX IF NOT EXISTS idx_student_registrations_phone_norm
  ON public.student_registrations (public.normalize_phone(phone));

CREATE OR REPLACE FUNCTION public.prevent_duplicate_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(NEW.email));
  v_phone text := public.normalize_phone(NEW.phone);
BEGIN
  IF TG_OP = 'UPDATE'
     AND lower(btrim(OLD.email)) IS NOT DISTINCT FROM v_email
     AND public.normalize_phone(OLD.phone) IS NOT DISTINCT FROM v_phone THEN
    RETURN NEW;
  END IF;

  IF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.student_registrations r
    WHERE lower(btrim(r.email)) = v_email AND r.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_EMAIL: a registration already exists with the email %', NEW.email
      USING ERRCODE = '23505';
  END IF;

  IF v_phone IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.student_registrations r
    WHERE public.normalize_phone(r.phone) = v_phone AND r.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_PHONE: a registration already exists with the phone number %', NEW.phone
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_registration ON public.student_registrations;
CREATE TRIGGER trg_prevent_duplicate_registration
BEFORE INSERT OR UPDATE OF email, phone ON public.student_registrations
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_registration();