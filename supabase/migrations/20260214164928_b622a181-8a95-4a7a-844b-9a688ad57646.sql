
-- Create scholarship_applications table
CREATE TABLE public.scholarship_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.student_registrations(id),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.programs(id),
  employment_status TEXT NOT NULL,
  household_size INTEGER NOT NULL DEFAULT 1,
  monthly_income TEXT NOT NULL,
  motivation TEXT NOT NULL,
  how_training_helps TEXT NOT NULL,
  supporting_info TEXT,
  requested_percentage INTEGER NOT NULL DEFAULT 50,
  granted_percentage INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, program_id)
);

-- Enable RLS
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;

-- Students can insert their own applications
CREATE POLICY "Students can insert own scholarship applications"
ON public.scholarship_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Students can view their own applications
CREATE POLICY "Students can view own scholarship applications"
ON public.scholarship_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all scholarship applications"
ON public.scholarship_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can update all applications
CREATE POLICY "Admins can update scholarship applications"
ON public.scholarship_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_scholarship_applications_updated_at
BEFORE UPDATE ON public.scholarship_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
