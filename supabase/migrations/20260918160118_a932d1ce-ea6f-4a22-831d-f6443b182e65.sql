CREATE TABLE public.coding_challenge_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  track text NOT NULL,
  challenge_id integer NOT NULL,
  submitted_code text NOT NULL DEFAULT '',
  is_correct boolean NOT NULL DEFAULT false,
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.coding_challenge_attempts TO authenticated;
GRANT ALL ON public.coding_challenge_attempts TO service_role;

ALTER TABLE public.coding_challenge_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own attempts" ON public.coding_challenge_attempts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff view all attempts" ON public.coding_challenge_attempts
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'teacher')
  );
CREATE POLICY "Users insert own attempts" ON public.coding_challenge_attempts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.coding_challenge_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  track text NOT NULL,
  challenge_id integer NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, track, challenge_id)
);

GRANT SELECT, INSERT, UPDATE ON public.coding_challenge_progress TO authenticated;
GRANT ALL ON public.coding_challenge_progress TO service_role;

ALTER TABLE public.coding_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress" ON public.coding_challenge_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff view all progress" ON public.coding_challenge_progress
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'teacher')
  );
CREATE POLICY "Users insert own progress" ON public.coding_challenge_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own progress" ON public.coding_challenge_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_ccp_user ON public.coding_challenge_progress(user_id);
CREATE INDEX idx_cca_user ON public.coding_challenge_attempts(user_id);

CREATE TRIGGER update_coding_challenge_progress_updated_at
  BEFORE UPDATE ON public.coding_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();