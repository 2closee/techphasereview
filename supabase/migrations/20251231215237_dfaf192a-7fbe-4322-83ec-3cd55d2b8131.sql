-- Create programs table for courses
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('culinary', 'fashion')),
    duration TEXT NOT NULL,
    duration_unit TEXT NOT NULL DEFAULT 'months' CHECK (duration_unit IN ('weeks', 'months', 'years')),
    tuition_fee NUMERIC NOT NULL DEFAULT 0,
    registration_fee NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    max_students INTEGER,
    start_date DATE,
    requirements TEXT[],
    curriculum JSONB,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Programs policies
CREATE POLICY "Anyone can view active programs"
ON public.programs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all programs"
ON public.programs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create programs"
ON public.programs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update programs"
ON public.programs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete programs"
ON public.programs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create student registrations table
CREATE TABLE public.student_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Nigeria',
    program_id UUID REFERENCES public.programs(id),
    education_level TEXT,
    previous_experience TEXT,
    how_heard_about_us TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'enrolled')),
    notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;

-- Registrations policies
CREATE POLICY "Anyone can submit registration"
ON public.student_registrations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all registrations"
ON public.student_registrations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update registrations"
ON public.student_registrations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own registration"
ON public.student_registrations FOR SELECT
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON public.programs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_registrations_updated_at
    BEFORE UPDATE ON public.student_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();