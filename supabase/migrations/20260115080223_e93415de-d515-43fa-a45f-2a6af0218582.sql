-- Add matriculation_number column to student_registrations
ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS matriculation_number TEXT UNIQUE;

-- Add location_code to training_locations for generating matriculation numbers
ALTER TABLE public.training_locations 
ADD COLUMN IF NOT EXISTS location_code INTEGER;

-- Add program_code to programs for generating matriculation numbers  
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS program_code INTEGER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_registrations_matriculation ON public.student_registrations(matriculation_number);

-- Update existing locations with codes (starting from 1)
UPDATE public.training_locations 
SET location_code = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num 
  FROM public.training_locations
) as subquery
WHERE public.training_locations.id = subquery.id
AND public.training_locations.location_code IS NULL;

-- Update existing programs with codes (starting from 1)
UPDATE public.programs 
SET program_code = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num 
  FROM public.programs
) as subquery
WHERE public.programs.id = subquery.id
AND public.programs.program_code IS NULL;

-- Create function to generate matriculation number
CREATE OR REPLACE FUNCTION public.generate_matriculation_number(
  p_location_id UUID,
  p_program_id UUID,
  p_batch_number INTEGER,
  p_batch_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location_code INTEGER;
  v_program_code INTEGER;
  v_student_sequence INTEGER;
  v_matriculation TEXT;
BEGIN
  -- Get location code
  SELECT location_code INTO v_location_code
  FROM training_locations WHERE id = p_location_id;
  
  -- Get program code
  SELECT program_code INTO v_program_code
  FROM programs WHERE id = p_program_id;
  
  -- Count existing students in this batch + 1 for the new student
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_student_sequence
  FROM student_registrations
  WHERE batch_id = p_batch_id
  AND matriculation_number IS NOT NULL;
  
  -- Format: LPBBSSS (7 digits)
  -- L = location (1 digit, mod 10 to keep single digit)
  -- P = program (1 digit, mod 10 to keep single digit)
  -- BB = batch (2 digits, mod 100)
  -- SSS = student sequence (3 digits)
  v_matriculation := LPAD((v_location_code % 10)::TEXT, 1, '0') ||
                     LPAD((v_program_code % 10)::TEXT, 1, '0') ||
                     LPAD((p_batch_number % 100)::TEXT, 2, '0') ||
                     LPAD((v_student_sequence % 1000)::TEXT, 3, '0');
  
  RETURN v_matriculation;
END;
$$;

-- Update the assign_student_to_batch function to also generate matriculation number
CREATE OR REPLACE FUNCTION public.assign_student_to_batch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_batch_id UUID;
  current_batch_number INTEGER;
  current_batch_count INTEGER;
  v_matriculation TEXT;
BEGIN
  -- Only process if payment_status changed to 'paid' and has a location
  IF NEW.payment_status = 'paid' 
     AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')
     AND NEW.preferred_location_id IS NOT NULL
     AND NEW.program_id IS NOT NULL THEN
    
    -- Find or create the current open batch for this program at this location
    SELECT id, batch_number, current_count INTO current_batch_id, current_batch_number, current_batch_count
    FROM course_batches
    WHERE program_id = NEW.program_id
      AND location_id = NEW.preferred_location_id
      AND status = 'open'
    ORDER BY batch_number DESC
    LIMIT 1;
    
    -- If no open batch exists or current batch is full, create a new one
    IF current_batch_id IS NULL OR current_batch_count >= 15 THEN
      -- Mark current batch as full if it exists and is full
      IF current_batch_id IS NOT NULL AND current_batch_count >= 15 THEN
        UPDATE course_batches SET status = 'full', updated_at = now() WHERE id = current_batch_id;
        current_batch_number := current_batch_number + 1;
      ELSE
        current_batch_number := COALESCE(current_batch_number, 0) + 1;
      END IF;
      
      -- Create new batch
      INSERT INTO course_batches (program_id, location_id, batch_number, current_count, status)
      VALUES (NEW.program_id, NEW.preferred_location_id, current_batch_number, 1, 'open')
      RETURNING id INTO current_batch_id;
    ELSE
      -- Increment current batch count
      UPDATE course_batches 
      SET current_count = current_count + 1, updated_at = now()
      WHERE id = current_batch_id;
      
      -- Check if batch is now full
      IF current_batch_count + 1 >= 15 THEN
        UPDATE course_batches SET status = 'full', updated_at = now() WHERE id = current_batch_id;
      END IF;
    END IF;
    
    -- Assign student to batch
    NEW.batch_id := current_batch_id;
    
    -- Generate matriculation number
    v_matriculation := generate_matriculation_number(
      NEW.preferred_location_id,
      NEW.program_id,
      current_batch_number,
      current_batch_id
    );
    NEW.matriculation_number := v_matriculation;
  END IF;
  
  RETURN NEW;
END;
$$;