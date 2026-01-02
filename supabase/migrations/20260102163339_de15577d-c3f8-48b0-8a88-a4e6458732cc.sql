-- Drop the existing constraint
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_category_check;

-- Add new constraint with updated categories
ALTER TABLE programs ADD CONSTRAINT programs_category_check 
  CHECK (category = ANY (ARRAY['software'::text, 'hardware'::text]));