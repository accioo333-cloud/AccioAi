-- Fix user_interactions RLS policy
-- Run this in Supabase SQL Editor

-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'user_interactions';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can insert own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON user_interactions;

-- Recreate policies with correct permissions
CREATE POLICY "Users can view own interactions" 
  ON user_interactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" 
  ON user_interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" 
  ON user_interactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Verify policies are created
SELECT * FROM pg_policies WHERE tablename = 'user_interactions';
