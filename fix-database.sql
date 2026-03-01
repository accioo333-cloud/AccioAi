-- Fix user_profiles table schema
-- Run this in Supabase SQL Editor

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- If email and avatar_url columns are missing, add them:
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify the fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
