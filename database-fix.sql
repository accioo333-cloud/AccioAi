-- AccioAI Database Schema Fix
-- Run this in Supabase SQL Editor to fix user_profiles table

-- Add missing columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing records with email from auth.users
UPDATE user_profiles 
SET email = (SELECT email FROM auth.users WHERE auth.users.id = user_profiles.id)
WHERE email IS NULL;

-- Verify the fix
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
