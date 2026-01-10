-- Create course_batches table for batch grouping at Warri
CREATE TABLE public.course_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.training_locations(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL DEFAULT 1,
  max_students INTEGER NOT NULL DEFAULT 15,
  current_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed')),
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (program_id, location_id, batch_number)
);

-- Add batch-related columns to student_registrations
ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS preferred_location_id UUID REFERENCES public.training_locations(id),
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.course_batches(id),
ADD COLUMN IF NOT EXISTS projected_batch_number INTEGER;

-- Enable RLS on course_batches
ALTER TABLE public.course_batches ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read batches (for displaying batch info on registration)
CREATE POLICY "Anyone can view batches"
ON public.course_batches
FOR SELECT
USING (true);

-- Only admins can modify batches
CREATE POLICY "Admins can manage batches"
ON public.course_batches
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to assign student to batch when payment is confirmed
CREATE OR REPLACE FUNCTION public.assign_student_to_batch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  warri_location_id UUID := 'af2ca449-9394-46dd-b4b3-216bb50e9aeb';
  current_batch_id UUID;
  current_batch_number INTEGER;
  current_batch_count INTEGER;
BEGIN
  -- Only process if payment_status changed to 'paid' and location is Warri
  IF NEW.payment_status = 'paid' 
     AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')
     AND NEW.preferred_location_id = warri_location_id THEN
    
    -- Find or create the current open batch for this program at Warri
    SELECT id, batch_number, current_count INTO current_batch_id, current_batch_number, current_batch_count
    FROM course_batches
    WHERE program_id = NEW.program_id
      AND location_id = warri_location_id
      AND status = 'open'
    ORDER BY batch_number DESC
    LIMIT 1;
    
    -- If no open batch exists or current batch is full, create a new one
    IF current_batch_id IS NULL OR current_batch_count >= 15 THEN
      -- Mark current batch as full if it exists
      IF current_batch_id IS NOT NULL AND current_batch_count >= 15 THEN
        UPDATE course_batches SET status = 'full', updated_at = now() WHERE id = current_batch_id;
        current_batch_number := current_batch_number + 1;
      ELSE
        current_batch_number := COALESCE(current_batch_number, 0) + 1;
      END IF;
      
      -- Create new batch
      INSERT INTO course_batches (program_id, location_id, batch_number, current_count, status)
      VALUES (NEW.program_id, warri_location_id, current_batch_number, 1, 'open')
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for batch assignment
DROP TRIGGER IF EXISTS trigger_assign_student_to_batch ON public.student_registrations;
CREATE TRIGGER trigger_assign_student_to_batch
BEFORE UPDATE ON public.student_registrations
FOR EACH ROW
EXECUTE FUNCTION public.assign_student_to_batch();

-- Create trigger for updated_at on course_batches
CREATE TRIGGER update_course_batches_updated_at
BEFORE UPDATE ON public.course_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();