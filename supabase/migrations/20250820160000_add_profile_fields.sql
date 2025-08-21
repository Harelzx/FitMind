-- Add missing profile fields for comprehensive user data collection

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height DECIMAL(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal DECIMAL(4,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_calories INTEGER;

-- Add constraints
ALTER TABLE profiles ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female'));
ALTER TABLE profiles ADD CONSTRAINT check_activity_level CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
ALTER TABLE profiles ADD CONSTRAINT check_height CHECK (height > 0 AND height < 300);
ALTER TABLE profiles ADD CONSTRAINT check_weekly_goal CHECK (weekly_goal > 0 AND weekly_goal <= 2);

-- Update existing profiles with default values if needed
UPDATE profiles 
SET 
  activity_level = 'moderate',
  weekly_goal = 0.5
WHERE activity_level IS NULL OR weekly_goal IS NULL;

COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth for age calculations';
COMMENT ON COLUMN profiles.gender IS 'User gender for BMR calculations';
COMMENT ON COLUMN profiles.height IS 'User height in centimeters';
COMMENT ON COLUMN profiles.activity_level IS 'User daily activity level for calorie calculations';
COMMENT ON COLUMN profiles.weekly_goal IS 'Target weekly weight loss in kg';
COMMENT ON COLUMN profiles.dietary_restrictions IS 'User dietary restrictions and preferences';
COMMENT ON COLUMN profiles.motivation IS 'User motivation for weight loss journey';
COMMENT ON COLUMN profiles.target_calories IS 'Daily calorie target based on goals';