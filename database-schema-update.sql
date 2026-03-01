-- Add image_url and source_url to content_cards
ALTER TABLE content_cards 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add image_url to raw_content
ALTER TABLE raw_content
ADD COLUMN IF NOT EXISTS image_url TEXT;
