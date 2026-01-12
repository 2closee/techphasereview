-- Create junction table for location-specific programs
CREATE TABLE public.location_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.training_locations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(location_id, program_id)
);

-- Enable Row Level Security
ALTER TABLE public.location_programs ENABLE ROW LEVEL SECURITY;

-- Anyone can view location_programs (needed for registration form)
CREATE POLICY "Anyone can view location_programs"
ON public.location_programs
FOR SELECT
USING (true);

-- Only admins can insert location_programs
CREATE POLICY "Admins can insert location_programs"
ON public.location_programs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update location_programs
CREATE POLICY "Admins can update location_programs"
ON public.location_programs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete location_programs
CREATE POLICY "Admins can delete location_programs"
ON public.location_programs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add index for faster lookups
CREATE INDEX idx_location_programs_location ON public.location_programs(location_id);
CREATE INDEX idx_location_programs_program ON public.location_programs(program_id);