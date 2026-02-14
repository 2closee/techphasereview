
-- Fix has_role function to treat super_admin as having all permissions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'super_admin')
  );
$$;

-- Add profiles INSERT policy for admins
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create toggle_user_suspension function for super admins
CREATE OR REPLACE FUNCTION public.toggle_user_suspension(target_user_id uuid, suspend boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only super admins can suspend/unsuspend users';
  END IF;

  UPDATE public.profiles
  SET 
    is_suspended = suspend,
    suspended_at = CASE WHEN suspend THEN now() ELSE NULL END,
    suspended_by = CASE WHEN suspend THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;
