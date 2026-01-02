-- Create training_locations table for Port Harcourt and Warri centers
CREATE TABLE public.training_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geofence_radius_meters INTEGER NOT NULL DEFAULT 100,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.training_locations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_attendees INTEGER NOT NULL DEFAULT 30,
  instructor_id UUID REFERENCES public.teachers(id),
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create session_enrollments table for trainee self-enrollment
CREATE TABLE public.session_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'absent', 'cancelled')),
  UNIQUE(session_id, student_id)
);

-- Create geolocation_checkins table for attendance with location verification
CREATE TABLE public.geolocation_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  distance_from_center_meters DECIMAL(10, 2),
  is_within_geofence BOOLEAN NOT NULL DEFAULT false,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'manual_override')),
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'reminder', 'alert', 'success', 'warning')),
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create course_progress table for tracking progress
CREATE TABLE public.course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  attended_sessions INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'dropped')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, program_id)
);

-- Update student_registrations to add preferred_location
ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS preferred_location_id UUID REFERENCES public.training_locations(id);

-- Enable RLS
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geolocation_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- Training locations policies
CREATE POLICY "Anyone can view active locations" ON public.training_locations
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage locations" ON public.training_locations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Training sessions policies
CREATE POLICY "Anyone authenticated can view sessions" ON public.training_sessions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and teachers can manage sessions" ON public.training_sessions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Session enrollments policies
CREATE POLICY "Students can view their enrollments" ON public.session_enrollments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Students can enroll themselves" ON public.session_enrollments
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
);

CREATE POLICY "Admins can manage all enrollments" ON public.session_enrollments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Geolocation checkins policies
CREATE POLICY "Students can create their own checkins" ON public.geolocation_checkins
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
);

CREATE POLICY "Students can view their own checkins" ON public.geolocation_checkins
FOR SELECT USING (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Admins and teachers can manage checkins" ON public.geolocation_checkins
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Course progress policies
CREATE POLICY "Students can view their progress" ON public.course_progress
FOR SELECT USING (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Admins can manage progress" ON public.course_progress
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default training locations (Port Harcourt and Warri)
INSERT INTO public.training_locations (name, code, address, city, state, latitude, longitude, geofence_radius_meters, phone, email)
VALUES 
  ('Meranos Port Harcourt Center', 'PHC', '123 Trans Amadi Industrial Layout', 'Port Harcourt', 'Rivers', 4.8156, 7.0498, 150, '+234 803 000 0001', 'portharcourt@meranos.ng'),
  ('Meranos Warri Center', 'WRI', '45 Effurun-Sapele Road', 'Warri', 'Delta', 5.5167, 5.7500, 150, '+234 803 000 0002', 'warri@meranos.ng');

-- Create triggers for updated_at
CREATE TRIGGER update_training_locations_updated_at
BEFORE UPDATE ON public.training_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
BEFORE UPDATE ON public.training_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at
BEFORE UPDATE ON public.course_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();