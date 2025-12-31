-- Create teachers table
CREATE TABLE public.teachers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    specialization TEXT NOT NULL,
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table for student fee payments
CREATE TABLE public.student_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.student_registrations(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'tuition',
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_reference TEXT,
    notes TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

-- Teachers RLS Policies
CREATE POLICY "Admins can manage teachers"
ON public.teachers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view active teachers"
ON public.teachers
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) AND is_active = true);

CREATE POLICY "Public can view active teachers"
ON public.teachers
FOR SELECT
USING (is_active = true);

-- Student Payments RLS Policies
CREATE POLICY "Admins can manage payments"
ON public.student_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view payments"
ON public.student_payments
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Create updated_at triggers
CREATE TRIGGER update_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_payments_updated_at
BEFORE UPDATE ON public.student_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();