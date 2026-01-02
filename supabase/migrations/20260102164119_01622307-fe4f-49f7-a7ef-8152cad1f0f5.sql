-- Add new columns to student_registrations table
ALTER TABLE student_registrations 
ADD COLUMN IF NOT EXISTS middle_name text,
ADD COLUMN IF NOT EXISTS is_pwd text,
ADD COLUMN IF NOT EXISTS alternative_phone text,
ADD COLUMN IF NOT EXISTS lga text,
ADD COLUMN IF NOT EXISTS current_income text;