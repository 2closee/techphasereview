-- Remove duplicate 'admin' role for users who already have 'super_admin'
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (
    SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
  );