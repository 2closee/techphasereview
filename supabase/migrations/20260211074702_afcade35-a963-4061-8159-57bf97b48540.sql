
-- Phase 1 Step 2: All remaining schema changes

-- 1B. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS specialization text,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid;

-- 1C. Create missing tables

CREATE TABLE IF NOT EXISTS public.program_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.program_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.program_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.program_categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.program_categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view certifications" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Admins can insert certifications" ON public.certifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update certifications" ON public.certifications FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete certifications" ON public.certifications FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE IF NOT EXISTS public.certification_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  UNIQUE (certification_id, program_id)
);
ALTER TABLE public.certification_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view certification courses" ON public.certification_courses FOR SELECT USING (true);
CREATE POLICY "Admins can insert certification courses" ON public.certification_courses FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can update certification courses" ON public.certification_courses FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins can delete certification courses" ON public.certification_courses FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE IF NOT EXISTS public.cleanup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  records_deleted integer NOT NULL DEFAULT 0,
  ran_at timestamptz NOT NULL DEFAULT now(),
  details jsonb
);
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view cleanup logs" ON public.cleanup_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "System can insert cleanup logs" ON public.cleanup_logs FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 1D. Fix settings: add unique constraint, drop default, alter type, seed
ALTER TABLE public.settings ADD CONSTRAINT settings_key_unique UNIQUE (key);
ALTER TABLE public.settings ALTER COLUMN value DROP DEFAULT;
ALTER TABLE public.settings ALTER COLUMN value TYPE jsonb USING value::jsonb;
ALTER TABLE public.settings ALTER COLUMN value SET DEFAULT '""'::jsonb;

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

-- 1E. Database functions and triggers

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'::app_role) $$;

CREATE OR REPLACE FUNCTION public.assign_student_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'student'::app_role) ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_student_role ON public.student_registrations;
CREATE TRIGGER trg_assign_student_role
  AFTER UPDATE OF user_id ON public.student_registrations
  FOR EACH ROW EXECUTE FUNCTION public.assign_student_role();

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

-- 1G. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('program-images', 'program-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('passport-photos', 'passport-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view program images" ON storage.objects FOR SELECT USING (bucket_id = 'program-images');
CREATE POLICY "Admins can upload program images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'program-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Admins can update program images" ON storage.objects FOR UPDATE USING (bucket_id = 'program-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));
CREATE POLICY "Admins can delete program images" ON storage.objects FOR DELETE USING (bucket_id = 'program-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

CREATE POLICY "Anyone can view passport photos" ON storage.objects FOR SELECT USING (bucket_id = 'passport-photos');
CREATE POLICY "Students can upload own passport photo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'passport-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Students can update own passport photo" ON storage.objects FOR UPDATE USING (bucket_id = 'passport-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
