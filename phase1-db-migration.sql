-- Phase 1: Database Changes
-- Run this in Supabase SQL Editor

-- 1. Add unique constraint to prevent duplicate content
ALTER TABLE raw_content 
ADD CONSTRAINT raw_content_url_unique UNIQUE (url);

-- 2. Create user preferences table for Phase 2
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profession TEXT,
  content_categories TEXT[], -- ['technology', 'business', 'science', etc.]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. Add more RSS sources for different categories
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'technology', true),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'technology', true),
  ('Harvard Business Review', 'https://hbr.org/feed', 'business', true),
  ('ScienceDaily', 'https://www.sciencedaily.com/rss/all.xml', 'science', true),
  ('Smashing Magazine', 'https://www.smashingmagazine.com/feed/', 'design', true)
ON CONFLICT (source_url) DO NOTHING;
