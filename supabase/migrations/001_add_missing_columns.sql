-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS target_calories INTEGER;

-- Update activity_level enum to match app values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_activity_level_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_activity_level_check 
CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));

-- Make start_weight, current_weight, target_weight nullable for gradual profile completion
ALTER TABLE profiles ALTER COLUMN start_weight DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN current_weight DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN target_weight DROP NOT NULL;