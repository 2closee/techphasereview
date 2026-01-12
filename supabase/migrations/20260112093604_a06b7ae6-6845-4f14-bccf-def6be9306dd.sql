-- Add new columns for attendance commitment, guarantor info, and terms acceptance
ALTER TABLE public.student_registrations
ADD COLUMN IF NOT EXISTS can_attend_weekly TEXT,
ADD COLUMN IF NOT EXISTS guarantor_full_name TEXT,
ADD COLUMN IF NOT EXISTS guarantor_address TEXT,
ADD COLUMN IF NOT EXISTS guarantor_phone TEXT,
ADD COLUMN IF NOT EXISTS guarantor_email TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;