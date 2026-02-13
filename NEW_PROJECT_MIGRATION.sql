-- ============================================================
-- MERANOS LMS - Complete Database Setup for New Supabase Project
-- FIXED: Reordered to avoid missing table errors
-- Run this ENTIRE script in the SQL Editor of your new project
-- ============================================================

-- ============================================================
-- CLEANUP PREAMBLE (safe to re-run)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_assign_student_role ON public.student_registrations;
DROP TRIGGER IF EXISTS trigger_assign_student_to_batch ON public.student_registrations;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_programs_updated_at ON public.programs;
DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;
DROP TRIGGER IF EXISTS update_course_batches_updated_at ON public.course_batches;
DROP TRIGGER IF EXISTS update_student_registrations_updated_at ON public.student_registrations;
DROP TRIGGER IF EXISTS update_student_payments_updated_at ON public.student_payments;
DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON public.training_sessions;
DROP TRIGGER IF EXISTS update_training_locations_updated_at ON public.training_locations;
DROP TRIGGER IF EXISTS update_course_progress_updated_at ON public.course_progress;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;

DROP TABLE IF EXISTS public.geolocation_checkins CASCADE;
DROP TABLE IF EXISTS public.session_enrollments CASCADE;
DROP TABLE IF EXISTS public.course_progress CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.training_sessions CASCADE;
DROP TABLE IF EXISTS public.student_payments CASCADE;
DROP TABLE IF EXISTS public.enrollment_payments CASCADE;
DROP TABLE IF EXISTS public.student_registrations CASCADE;
DROP TABLE IF EXISTS public.course_batches CASCADE;
DROP TABLE IF EXISTS public.location_programs CASCADE;
DROP TABLE IF EXISTS public.certification_courses CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;
DROP TABLE IF EXISTS public.training_locations CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.program_categories CASCADE;
DROP TABLE IF EXISTS public.cleanup_logs CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.toggle_user_suspension CASCADE;
DROP FUNCTION IF EXISTS public.assign_student_role CASCADE;
DROP FUNCTION IF EXISTS public.assign_student_to_batch CASCADE;
DROP FUNCTION IF EXISTS public.generate_matriculation_number CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin CASCADE;
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============================================================
-- PART 1: ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'accountant', 'teacher', 'student');

-- ============================================================
-- PART 2: ALL TABLE CREATION (no RLS, no triggers, no policies)
-- ============================================================

-- 2A. Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  bio text,
  specialization text,
  is_suspended boolean NOT NULL DEFAULT false,
  suspended_at timestamptz,
  suspended_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2B. User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 2C. Settings
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '""'::jsonb
);

-- 2D. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'reminder', 'alert', 'success', 'warning')),
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2E. Program categories
CREATE TABLE public.program_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2F. Programs
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category = ANY (ARRAY['software'::text, 'hardware'::text])),
  duration text NOT NULL,
  duration_unit text NOT NULL DEFAULT 'months' CHECK (duration_unit IN ('weeks', 'months', 'years')),
  tuition_fee numeric NOT NULL DEFAULT 0,
  registration_fee numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  max_students integer,
  start_date date,
  requirements text[],
  curriculum jsonb,
  image_url text,
  program_code integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2G. Certifications
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2H. Certification courses (junction)
CREATE TABLE public.certification_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  UNIQUE (certification_id, program_id)
);

-- 2I. Training locations
CREATE TABLE public.training_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  geofence_radius_meters integer NOT NULL DEFAULT 100,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  location_code integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2J. Location programs (junction)
CREATE TABLE public.location_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.training_locations(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id, program_id)
);
CREATE INDEX idx_location_programs_location ON public.location_programs(location_id);
CREATE INDEX idx_location_programs_program ON public.location_programs(program_id);

-- 2K. Teachers
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  specialization text NOT NULL,
  qualification text,
  experience_years integer DEFAULT 0,
  bio text,
  is_active boolean DEFAULT true,
  hire_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2L. Course batches
CREATE TABLE public.course_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.training_locations(id) ON DELETE CASCADE,
  batch_number integer NOT NULL DEFAULT 1,
  max_students integer NOT NULL DEFAULT 15,
  current_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed')),
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, location_id, batch_number)
);

-- 2M. Student registrations
CREATE TABLE public.student_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  address text,
  city text,
  state text,
  lga text,
  country text DEFAULT 'Nigeria',
  program_id uuid REFERENCES public.programs(id),
  preferred_location_id uuid REFERENCES public.training_locations(id),
  batch_id uuid REFERENCES public.course_batches(id),
  projected_batch_number integer,
  education_level text,
  previous_experience text,
  how_heard_about_us text,
  emergency_contact_name text,
  emergency_contact_phone text,
  is_pwd text,
  alternative_phone text,
  current_income text,
  can_attend_weekly text,
  guarantor_full_name text,
  guarantor_address text,
  guarantor_phone text,
  guarantor_email text,
  terms_accepted boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'enrolled')),
  payment_status text NOT NULL DEFAULT 'unpaid',
  account_created boolean NOT NULL DEFAULT false,
  matriculation_number text UNIQUE,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_student_registrations_payment_status ON public.student_registrations(payment_status);
CREATE INDEX idx_student_registrations_user_id ON public.student_registrations(user_id);
CREATE INDEX idx_student_registrations_matriculation ON public.student_registrations(matriculation_number);

-- 2N. Enrollment payments
CREATE TABLE public.enrollment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  payment_reference text UNIQUE,
  payment_provider text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX idx_enrollment_payments_registration_id ON public.enrollment_payments(registration_id);
CREATE INDEX idx_enrollment_payments_status ON public.enrollment_payments(status);

-- 2O. Student payments (manual/cash)
CREATE TABLE public.student_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.student_registrations(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_type text NOT NULL DEFAULT 'tuition',
  payment_method text NOT NULL DEFAULT 'cash',
  payment_reference text,
  notes text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2P. Training sessions
CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.training_locations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  max_attendees integer NOT NULL DEFAULT 30,
  instructor_id uuid REFERENCES public.teachers(id),
  is_cancelled boolean DEFAULT false,
  cancellation_reason text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2Q. Session enrollments
CREATE TABLE public.session_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'absent', 'cancelled')),
  UNIQUE(session_id, student_id)
);

-- 2R. Attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, program_id, date)
);

-- 2S. Geolocation checkins
CREATE TABLE public.geolocation_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  check_in_time timestamptz DEFAULT now(),
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  distance_from_center_meters decimal(10, 2),
  is_within_geofence boolean NOT NULL DEFAULT false,
  device_info jsonb,
  ip_address text,
  user_agent text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'manual_override')),
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 2T. Course progress
CREATE TABLE public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  total_sessions integer DEFAULT 0,
  attended_sessions integer DEFAULT 0,
  completion_percentage decimal(5, 2) DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'dropped')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, program_id)
);

-- 2U. Cleanup logs
CREATE TABLE public.cleanup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  records_deleted integer NOT NULL DEFAULT 0,
  ran_at timestamptz NOT NULL DEFAULT now(),
  details jsonb
);

-- 2V. Password reset tokens
CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);

-- ============================================================
-- PART 3: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geolocation_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4: ALL FUNCTIONS (tables exist now, so references are valid)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'::app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_matriculation_number(
  p_location_id uuid, p_program_id uuid, p_batch_number integer, p_batch_id uuid
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_location_code INTEGER;
  v_program_code INTEGER;
  v_student_sequence INTEGER;
  v_matriculation TEXT;
BEGIN
  SELECT location_code INTO v_location_code FROM training_locations WHERE id = p_location_id;
  SELECT program_code INTO v_program_code FROM programs WHERE id = p_program_id;
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_student_sequence
  FROM student_registrations WHERE batch_id = p_batch_id AND matriculation_number IS NOT NULL;
  
  v_matriculation := LPAD((v_location_code % 10)::TEXT, 1, '0') ||
                     LPAD((v_program_code % 10)::TEXT, 1, '0') ||
                     LPAD((p_batch_number % 100)::TEXT, 2, '0') ||
                     LPAD((v_student_sequence % 1000)::TEXT, 3, '0');
  RETURN v_matriculation;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_student_to_batch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_batch_id UUID;
  current_batch_number INTEGER;
  current_batch_count INTEGER;
  v_matriculation TEXT;
BEGIN
  IF NEW.payment_status = 'paid' 
     AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')
     AND NEW.preferred_location_id IS NOT NULL
     AND NEW.program_id IS NOT NULL THEN
    
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
$$;

CREATE OR REPLACE FUNCTION public.assign_student_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'student'::app_role) ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_user_suspension(target_user_id uuid, suspend boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can suspend/unsuspend users';
  END IF;
  UPDATE public.profiles SET
    is_suspended = suspend,
    suspended_at = CASE WHEN suspend THEN now() ELSE NULL END,
    suspended_by = CASE WHEN suspend THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- ============================================================
-- PART 5: ALL TRIGGERS
-- ============================================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_locations_updated_at
BEFORE UPDATE ON public.training_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_batches_updated_at
BEFORE UPDATE ON public.course_batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_registrations_updated_at
BEFORE UPDATE ON public.student_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_payments_updated_at
BEFORE UPDATE ON public.student_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
BEFORE UPDATE ON public.training_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at
BEFORE UPDATE ON public.course_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-assign student role when user_id is linked
CREATE TRIGGER trg_assign_student_role
AFTER UPDATE OF user_id ON public.student_registrations
FOR EACH ROW EXECUTE FUNCTION public.assign_student_role();

-- Auto-assign batch + matriculation on payment
CREATE TRIGGER trigger_assign_student_to_batch
BEFORE UPDATE ON public.student_registrations
FOR EACH ROW EXECUTE FUNCTION public.assign_student_to_batch();

-- ============================================================
-- PART 6: ALL RLS POLICIES
-- ============================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Settings policies
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete settings" ON public.settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Program categories policies
CREATE POLICY "Anyone can view active categories" ON public.program_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.program_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.program_categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.program_categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Programs policies
CREATE POLICY "Anyone can view active programs" ON public.programs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all programs" ON public.programs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can create programs" ON public.programs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete programs" ON public.programs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Certifications policies
CREATE POLICY "Anyone can view certifications" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Admins can insert certifications" ON public.certifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update certifications" ON public.certifications FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete certifications" ON public.certifications FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Certification courses policies
CREATE POLICY "Anyone can view certification courses" ON public.certification_courses FOR SELECT USING (true);
CREATE POLICY "Admins can insert certification courses" ON public.certification_courses FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update certification courses" ON public.certification_courses FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete certification courses" ON public.certification_courses FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Training locations policies
CREATE POLICY "Anyone can view active locations" ON public.training_locations FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage locations" ON public.training_locations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Location programs policies
CREATE POLICY "Anyone can view location_programs" ON public.location_programs FOR SELECT USING (true);
CREATE POLICY "Admins can insert location_programs" ON public.location_programs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update location_programs" ON public.location_programs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete location_programs" ON public.location_programs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Teachers policies
CREATE POLICY "Admins can manage teachers" ON public.teachers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Teachers can view active teachers" ON public.teachers FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role) AND is_active = true);
CREATE POLICY "Public can view active teachers" ON public.teachers FOR SELECT USING (is_active = true);

-- Course batches policies
CREATE POLICY "Anyone can view batches" ON public.course_batches FOR SELECT USING (true);
CREATE POLICY "Admins can manage batches" ON public.course_batches FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Student registrations policies
CREATE POLICY "Public can submit registration" ON public.student_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public role can submit registration" ON public.student_registrations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view all registrations" ON public.student_registrations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update registrations" ON public.student_registrations FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own registration" ON public.student_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view registrations" ON public.student_registrations FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role));

-- Enrollment payments policies
CREATE POLICY "Allow public insert for enrollment payments" ON public.enrollment_payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can view their enrollment payments" ON public.enrollment_payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.student_registrations sr WHERE sr.id = enrollment_payments.registration_id AND sr.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all enrollment payments" ON public.enrollment_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Student payments policies
CREATE POLICY "Admins can manage payments" ON public.student_payments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Teachers can view payments" ON public.student_payments FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Accountants can manage payments" ON public.student_payments FOR ALL USING (has_role(auth.uid(), 'accountant'::app_role)) WITH CHECK (has_role(auth.uid(), 'accountant'::app_role));

-- Training sessions policies
CREATE POLICY "Anyone authenticated can view sessions" ON public.training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and teachers can manage sessions" ON public.training_sessions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Session enrollments policies
CREATE POLICY "Students can view their enrollments" ON public.session_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);
CREATE POLICY "Students can enroll themselves" ON public.session_enrollments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all enrollments" ON public.session_enrollments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Attendance policies
CREATE POLICY "Teachers can view attendance" ON public.attendance FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Teachers can create attendance" ON public.attendance FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Teachers can update attendance" ON public.attendance FOR UPDATE USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete attendance" ON public.attendance FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Geolocation checkins policies
CREATE POLICY "Students can create their own checkins" ON public.geolocation_checkins FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
);
CREATE POLICY "Students can view their own checkins" ON public.geolocation_checkins FOR SELECT USING (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);
CREATE POLICY "Admins and teachers can manage checkins" ON public.geolocation_checkins FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Course progress policies
CREATE POLICY "Students can view their progress" ON public.course_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM student_registrations sr WHERE sr.id = student_id AND sr.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);
CREATE POLICY "Admins can manage progress" ON public.course_progress FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Cleanup logs policies
CREATE POLICY "Admins can view cleanup logs" ON public.cleanup_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System can insert cleanup logs" ON public.cleanup_logs FOR INSERT WITH CHECK (true);

-- ============================================================
-- PART 7: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('program-images', 'program-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('passport-photos', 'passport-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view program images" ON storage.objects FOR SELECT USING (bucket_id = 'program-images');
CREATE POLICY "Admins can upload program images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'program-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Admins can update program images" ON storage.objects FOR UPDATE USING (bucket_id = 'program-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Admins can delete program images" ON storage.objects FOR DELETE USING (bucket_id = 'program-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

CREATE POLICY "Anyone can view passport photos" ON storage.objects FOR SELECT USING (bucket_id = 'passport-photos');
CREATE POLICY "Students can upload own passport photo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'passport-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Students can update own passport photo" ON storage.objects FOR UPDATE USING (bucket_id = 'passport-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- PART 8: SEED DATA
-- ============================================================

INSERT INTO public.settings (key, value) VALUES
  ('academy_name', '"Meranos ICT Training Academy"'),
  ('hero_title', '"Launch Your Tech Career"'),
  ('hero_subtitle', '"Industry-leading ICT training programs designed to transform beginners into skilled professionals"'),
  ('hero_badge_text', '"Enrollment Open for 2025"'),
  ('contact_email', '"info@meranos.com"'),
  ('contact_phone', '"+234 800 000 0000"'),
  ('contact_address', '"Lagos, Nigeria"'),
  ('enrollment_open', 'true'),
  ('geofence_radius_meters', '200'),
  ('theme_primary_color', '"#6366f1"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.training_locations (name, code, address, city, state, latitude, longitude, geofence_radius_meters, phone, email, location_code)
VALUES 
  ('Meranos Port Harcourt Center', 'PHC', '274 Port Harcourt - Aba Expy', 'Port Harcourt', 'Rivers', 4.8156, 7.0498, 150, '+234 803 000 0001', 'portharcourt@meranos.ng', 1),
  ('Meranos Warri Center', 'WRI', '71 Airport Road', 'Warri', 'Delta', 5.5167, 5.7500, 150, '+234 803 000 0002', 'warri@meranos.ng', 2);

-- Enable Realtime for settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- ============================================================
-- DONE! Now add secrets and run bootstrap-admin edge function.
-- ============================================================
