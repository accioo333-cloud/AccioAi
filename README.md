# AccioAI

An AI-powered content curation platform that delivers personalized, high-quality content through a swipe-based interface (Tinder-style UX).

## What It Does

1. **Fetches** content from 30+ RSS sources daily (automated via Vercel Cron)
2. **Processes** with LLMs (Groq/Llama 3.1) to generate summaries, insights, and action takeaways
3. **Personalizes** feed based on user-selected interests and categories
4. **Delivers** via swipe-based card stack with visual feedback
5. **Tracks** streaks, daily stats, and progress
6. **Runs** fully automated — zero manual intervention after setup

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Auth**: Supabase Auth (Email/Password + Google OAuth)
- **LLM**: Groq (Llama 3.1-8b-instant)
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel
- **Automation**: Vercel Cron Jobs

## Features

- **Two-page onboarding** — Name → Profession + content interests
- **Personalized feed** — Filtered by user's selected categories
- **Swipe gestures** — Mouse and touch support with rotation/fade animations
- **Visual feedback** — Green 👍 / Red 👎 overlays while swiping
- **Card stack** — Shows next 2 cards behind current card for depth effect
- **Progress bar** — Visual daily completion indicator
- **Streak tracking** — 🔥 Consecutive day tracking with longest streak record
- **Daily stats** — "X new today" counter
- **Search & filters** — Search by title/content, filter by category
- **Saved items** — Bookmark cards for later reading
- **Celebration animation** — Bouncing emojis when you finish all cards
- **Smart distribution** — 5 items per category (40 total per automation run)
- **Duplicate prevention** — DB-level unique constraints on URLs
- **Auto cleanup** — Deletes unprocessed content older than 7 days

## Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# Groq API (Required)
GROQ_API_KEY=your_groq_api_key
LLM_MODEL=llama-3.1-8b-instant

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL (Required for auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cron Secret (Required for production)
CRON_SECRET=your_random_secret
```

**Get API Keys:**
- Groq: https://console.groq.com
- Supabase: https://supabase.com/dashboard

### 2. Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences (interests + streaks)
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  profession TEXT,
  content_categories TEXT[],
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content sources (RSS feeds)
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_type TEXT DEFAULT 'rss',
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw content (unprocessed articles from RSS)
CREATE TABLE raw_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT UNIQUE,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content cards (AI-processed, user-facing)
CREATE TABLE content_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  difficulty_level TEXT,
  estimated_time_minutes INTEGER,
  tags TEXT[],
  image_url TEXT,
  source_url TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions (swipes, bookmarks, completions)
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES content_cards(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily stats (per-user per-day activity)
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cards_viewed INTEGER DEFAULT 0,
  cards_liked INTEGER DEFAULT 0,
  cards_saved INTEGER DEFAULT 0,
  cards_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Automation runs (cron job logs)
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items_fetched INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own interactions" ON user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON daily_stats FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_content_cards_created ON content_cards(created_at DESC);
CREATE INDEX idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_card ON user_interactions(card_id);
CREATE INDEX idx_raw_content_processed ON raw_content(processed);
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);
```

### 3. Add RSS Sources

```sql
INSERT INTO content_sources (name, source_url, category) VALUES
  -- Technology
  ('TechCrunch', 'https://techcrunch.com/feed/', 'technology'),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'technology'),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'technology'),
  ('Hacker News', 'https://hnrss.org/frontpage', 'technology'),
  ('Wired', 'https://www.wired.com/feed/rss', 'technology'),
  ('MIT Tech Review', 'https://www.technologyreview.com/feed/', 'technology'),
  -- AI/ML
  ('AI News', 'https://www.artificialintelligence-news.com/feed/', 'ai_ml'),
  ('ML Mastery', 'https://machinelearningmastery.com/feed/', 'ai_ml'),
  -- Business
  ('HBR', 'https://feeds.hbr.org/harvardbusiness', 'business'),
  ('Fast Company', 'https://www.fastcompany.com/latest/rss', 'business'),
  -- Science
  ('ScienceDaily', 'https://www.sciencedaily.com/rss/all.xml', 'science'),
  ('Phys.org', 'https://phys.org/rss-feed/', 'science'),
  -- Design
  ('Smashing Magazine', 'https://www.smashingmagazine.com/feed/', 'design'),
  ('A List Apart', 'https://alistapart.com/main/feed/', 'design'),
  -- Startups
  ('Indie Hackers', 'https://www.indiehackers.com/feed.xml', 'startups'),
  -- Finance
  ('Investopedia', 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline', 'finance'),
  -- Health
  ('Medical News Today', 'https://www.medicalnewstoday.com/newsfeeds/rss', 'health');
```

### 4. Supabase Auth Configuration

**Dashboard → Authentication → Providers → Email:**
- Enable Email provider
- Disable "Confirm email" for development

**Dashboard → Authentication → URL Configuration:**
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/callback`, `https://yourdomain.com/auth/confirm`

### 5. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
app/
├── page.tsx                          # Landing page (auth check → route)
├── layout.tsx                        # Root layout (fonts, metadata)
├── globals.css                       # Tailwind imports
├── onboarding/
│   ├── page.tsx                      # Step 1: Name entry
│   └── preferences/page.tsx          # Step 2: Interests selection
├── feed/page.tsx                     # Main swipe feed (auth guard)
├── saved/page.tsx                    # Saved items (auth guard)
├── auth/
│   ├── callback/route.ts             # OAuth callback handler
│   ├── confirm/route.ts              # Email verification
│   └── success/route.ts              # Post-auth redirect
├── actions/auth.ts                   # Server Actions (signIn/signUp/signOut)
└── api/
    ├── auth/signin/route.ts          # Email sign in
    ├── auth/signout/route.ts         # Sign out
    ├── feed/route.ts                 # Personalized card feed
    ├── interactions/route.ts         # Record swipes + update streaks
    ├── preferences/route.ts          # Save user interests
    ├── saved/route.ts                # Get bookmarked cards
    ├── search/route.ts               # Search + category filter
    ├── stats/route.ts                # Streak + daily stats
    ├── onboarding/route.ts           # Save user profile
    ├── automation/run/route.ts       # Daily content pipeline
    └── test-llm/route.ts             # LLM debug endpoint

components/
├── AuthButton.tsx                    # Email/password + Google OAuth form
├── OnboardingForm.tsx                # Name collection
├── PreferencesForm.tsx               # Profession + interest selection
├── FeedClient.tsx                    # Feed logic, search, progress, streaks
├── SwipeCard.tsx                     # Swipe gestures + visual feedback
├── CardDetailModal.tsx               # Full card view modal
└── SavedClient.tsx                   # Saved items list

lib/
├── supabase/client.ts                # Browser Supabase client
├── supabase/server.ts                # Server clients (read-write + read-only)
├── llm.ts                            # Groq API wrapper
├── automation/rss-fetcher.ts         # RSS feed parser
├── automation/processor.ts           # LLM prompt + response parsing
├── middleware/auth.ts                # requireAuth() helper
└── logger.ts                         # Structured JSON logging
```

## User Flow

```
Landing Page → Sign Up (email/password)
     ↓
Onboarding Step 1 → Enter name
     ↓
Onboarding Step 2 → Select profession + interests (Technology, AI/ML, Business, etc.)
     ↓
Feed → Swipe through personalized cards
  • Swipe right = Like
  • Swipe left = Skip
  • Read Later = Bookmark
  • Done = Complete
  • Tap = Expand full card
     ↓
All caught up → Celebration → Refresh or view saved items
```

## Content Pipeline

```
Vercel Cron (midnight daily)
     ↓
POST /api/automation/run (Authorization: Bearer <CRON_SECRET>)
     ↓
Fetch 30+ RSS feeds → Insert into raw_content (skip duplicates)
     ↓
Select 5 unprocessed items per category (40 total)
     ↓
Send each to Groq LLM → Get summary + insights + takeaways
     ↓
Create content_cards → Mark raw_content as processed
     ↓
Cleanup: delete unprocessed content older than 7 days
```

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy

The cron job is configured in `vercel.json` and runs daily at midnight UTC.

**Note:** Vercel Hobby plan has a 1-hour flexible window for cron execution.

### Manual Automation Trigger

```bash
# Using Vercel's header format
curl -X POST https://yourdomain.com/api/automation/run \
  -H "Authorization: Bearer your_cron_secret"

# Or using custom header
curl -X POST https://yourdomain.com/api/automation/run \
  -H "x-cron-secret: your_cron_secret"
```

### Check Automation Logs

```sql
SELECT status, started_at, items_fetched, items_processed, error_message
FROM automation_runs
ORDER BY created_at DESC
LIMIT 10;
```

## Color Scheme

50-30-20 rule:
- **50% Slate** — Backgrounds, text, borders
- **30% Indigo** — Primary actions, headers, gradients
- **20% Orange** — Accents, badges, gradient endpoints

## Development

```bash
npm run dev    # Start dev server
npm run build  # Type check + production build
npm run lint   # ESLint
```

## License

MIT
