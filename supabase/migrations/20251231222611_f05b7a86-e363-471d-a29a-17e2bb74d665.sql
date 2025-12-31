-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, program_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Teachers can view attendance for their programs
CREATE POLICY "Teachers can view attendance"
ON public.attendance
FOR SELECT
USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Teachers can create attendance records
CREATE POLICY "Teachers can create attendance"
ON public.attendance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Teachers can update attendance records
CREATE POLICY "Teachers can update attendance"
ON public.attendance
FOR UPDATE
USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Admins can delete attendance
CREATE POLICY "Admins can delete attendance"
ON public.attendance
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();