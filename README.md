# AccioAI

An AI-powered intelligence feed that delivers personalized, high-quality content through a swipe-based interface.

## What It Does

1. **Fetches** content from RSS sources daily (automated)
2. **Processes** with LLMs (Groq) to generate summaries, insights, and action takeaways
3. **Delivers** via swipe-based feed (Tinder-style UX)
4. **Tracks** user interactions for personalization
5. **Runs** fully automated with daily cron jobs

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email/Password)
- **LLM**: Groq (Llama 3.1)
- **Deployment**: Vercel
- **Automation**: Vercel Cron

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

-- Content sources (RSS feeds)
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT DEFAULT 'rss',
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw content (unprocessed)
CREATE TABLE raw_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT UNIQUE,
  published_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content cards (processed)
CREATE TABLE content_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  difficulty_level TEXT,
  estimated_time_minutes INTEGER,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES content_cards(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'view', 'like', 'bookmark', 'complete'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation runs
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
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

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own interactions" ON user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_content_cards_created ON content_cards(created_at DESC);
CREATE INDEX idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_card ON user_interactions(card_id);
CREATE INDEX idx_raw_content_processed ON raw_content(processed);
```

### 3. Add RSS Sources

```sql
INSERT INTO content_sources (name, source_url, category) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed/', 'technology'),
  ('Hacker News', 'https://hnrss.org/frontpage', 'technology');
```

### 4. Supabase Auth Configuration

**Dashboard → Authentication → Providers → Email:**
- Enable Email provider
- Disable "Confirm email" (for development)

**For production with email confirmation:**
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/confirm`

### 5. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

**Cron job runs daily at midnight** (configured in `vercel.json`)

### Manual Automation Trigger

```bash
curl -X POST https://yourdomain.com/api/automation/run \
  -H "x-cron-secret: your_cron_secret"
```

## Project Structure

```
app/
├── page.tsx                    # Landing page (session routing)
├── onboarding/page.tsx         # User onboarding
├── feed/page.tsx               # Swipe feed
├── auth/confirm/route.ts       # Email confirmation
└── api/
    ├── feed/route.ts           # Get content cards
    ├── interactions/route.ts   # Track swipes/actions
    ├── onboarding/route.ts     # Complete onboarding
    └── automation/run/route.ts # Daily automation

components/
├── AuthButton.tsx              # Email/password auth
├── OnboardingForm.tsx          # Name collection
├── FeedClient.tsx              # Swipe stack
└── SwipeCard.tsx               # Individual card

lib/
├── supabase/                   # Supabase clients
├── llm/                        # Groq provider
├── automation/                 # RSS fetcher & processor
└── middleware/                 # Auth middleware
```

## User Flow

1. **Sign up** with email/password
2. **Complete onboarding** (enter name)
3. **Swipe feed**:
   - Swipe right = like
   - Swipe left = skip
   - Read Later = bookmark
   - Done = complete
4. **Daily automation** fetches new content

## Database Schema

- `user_profiles` - User data
- `content_sources` - RSS feeds
- `raw_content` - Unprocessed articles
- `content_cards` - AI-processed cards
- `user_interactions` - Swipe tracking
- `automation_runs` - Job logs

## Development

```bash
# Type check
npm run build

# Lint
npm run lint
```

## License

MIT
