-- Phase 5: Add More RSS Sources
-- Run this in Supabase SQL Editor

-- Clear existing sources (optional - only if you want fresh start)
-- DELETE FROM content_sources;

-- Technology Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed/', 'technology', true),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'technology', true),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'technology', true),
  ('Wired', 'https://www.wired.com/feed/rss', 'technology', true),
  ('Hacker News', 'https://hnrss.org/frontpage', 'technology', true),
  ('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'technology', true)
ON CONFLICT (source_url) DO NOTHING;

-- AI/ML Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('AI News', 'https://www.artificialintelligence-news.com/feed/', 'ai_ml', true),
  ('Machine Learning Mastery', 'https://machinelearningmastery.com/feed/', 'ai_ml', true),
  ('Towards Data Science', 'https://towardsdatascience.com/feed', 'ai_ml', true)
ON CONFLICT (source_url) DO NOTHING;

-- Business Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('Harvard Business Review', 'https://hbr.org/feed', 'business', true),
  ('Forbes Business', 'https://www.forbes.com/business/feed/', 'business', true),
  ('Fast Company', 'https://www.fastcompany.com/latest/rss', 'business', true),
  ('Inc.com', 'https://www.inc.com/rss/', 'business', true)
ON CONFLICT (source_url) DO NOTHING;

-- Science Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('ScienceDaily', 'https://www.sciencedaily.com/rss/all.xml', 'science', true),
  ('Phys.org', 'https://phys.org/rss-feed/', 'science', true),
  ('Scientific American', 'https://www.scientificamerican.com/feed/', 'science', true),
  ('Nature News', 'https://www.nature.com/nature.rss', 'science', true)
ON CONFLICT (source_url) DO NOTHING;

-- Design Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('Smashing Magazine', 'https://www.smashingmagazine.com/feed/', 'design', true),
  ('A List Apart', 'https://alistapart.com/main/feed/', 'design', true),
  ('CSS-Tricks', 'https://css-tricks.com/feed/', 'design', true),
  ('Designer News', 'https://www.designernews.co/feed', 'design', true)
ON CONFLICT (source_url) DO NOTHING;

-- Startups Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('TechCrunch Startups', 'https://techcrunch.com/tag/startups/feed/', 'startups', true),
  ('Indie Hackers', 'https://www.indiehackers.com/feed', 'startups', true),
  ('Product Hunt Blog', 'https://blog.producthunt.com/feed', 'startups', true)
ON CONFLICT (source_url) DO NOTHING;

-- Finance Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('Bloomberg Markets', 'https://www.bloomberg.com/feed/podcast/markets-daily.xml', 'finance', true),
  ('Financial Times', 'https://www.ft.com/?format=rss', 'finance', true),
  ('Investopedia', 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline', 'finance', true)
ON CONFLICT (source_url) DO NOTHING;

-- Health Sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('Medical News Today', 'https://www.medicalnewstoday.com/rss', 'health', true),
  ('Healthline', 'https://www.healthline.com/rss', 'health', true),
  ('WebMD', 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', 'health', true)
ON CONFLICT (source_url) DO NOTHING;
