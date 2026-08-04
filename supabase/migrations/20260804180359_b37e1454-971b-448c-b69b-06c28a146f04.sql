ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_free_program boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.assign_student_to_batch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_batch_id UUID;
  current_batch_number INTEGER;
  current_batch_count INTEGER;
  v_matriculation TEXT;
BEGIN
  IF NEW.payment_status IN ('paid','waived')
     AND (OLD.payment_status IS NULL OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
     AND NEW.preferred_location_id IS NOT NULL
     AND NEW.program_id IS NOT NULL
     AND NEW.batch_id IS NULL THEN

    SELECT id, batch_number, current_count INTO current_batch_id, current_batch_number, current_batch_count
    FROM course_batches
    WHERE program_id = NEW.program_id AND location_id = NEW.preferred_location_id AND status = 'open'
    ORDER BY batch_number DESC LIMIT 1;

    IF current_batch_id IS NULL OR current_batch_count >= 15 THEN
      IF current_batch_id IS NOT NULL AND current_batch_count >= 15 THEN
        UPDATE course_batches SET status = 'full', updated_at = now() WHERE id = current_batch_id;
        current_batch_number := current_batch_number + 1;
      ELSE
        current_batch_number := COALESCE(current_batch_number, 0) + 1;
      END IF;

      INSERT INTO course_batches (program_id, location_id, batch_number, current_count, status)
      VALUES (NEW.program_id, NEW.preferred_location_id, current_batch_number, 1, 'open')
      RETURNING id INTO current_batch_id;
    ELSE
      UPDATE course_batches SET current_count = current_count + 1, updated_at = now() WHERE id = current_batch_id;
      IF current_batch_count + 1 >= 15 THEN
        UPDATE course_batches SET status = 'full', updated_at = now() WHERE id = current_batch_id;
      END IF;
    END IF;

    NEW.batch_id := current_batch_id;
    v_matriculation := generate_matriculation_number(NEW.preferred_location_id, NEW.program_id, current_batch_number, current_batch_id);
    NEW.matriculation_number := v_matriculation;
  END IF;
  RETURN NEW;
END;
$function$;