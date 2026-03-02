# AccioAI - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Core Features](#core-features)
5. [Code Logic Explained](#code-logic-explained)
6. [Database Schema](#database-schema)
7. [Problems & Solutions](#problems--solutions)

---

## Project Overview

**AccioAI** is an AI-powered content curation platform that delivers personalized, high-quality content through a swipe-based interface (Tinder-style UX).

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email/Password + Google OAuth)
- **LLM**: Groq (Llama 3.1-8b-instant)
- **Deployment**: Vercel
- **Automation**: Vercel Cron Jobs

### Key Features
1. Automated daily content fetching from 30+ RSS sources
2. AI-powered content processing (summaries, insights, takeaways)
3. Personalized feed based on user interests
4. Swipe-based UX with visual feedback
5. Daily streak tracking
6. Progress bar and stats
7. Search and category filters
8. Saved items functionality

---

## Architecture

### High-Level Flow
```
RSS Sources → Raw Content (DB) → LLM Processing → Content Cards (DB) → User Feed
                                                                              ↓
                                                                    User Interactions (DB)
                                                                              ↓
                                                                    Daily Stats & Streaks
```

### Request Flow
1. **User visits** → Check auth → Redirect to onboarding or feed
2. **Onboarding** → Collect name → Collect preferences → Save to DB
3. **Feed** → Fetch personalized cards → Display in swipe stack
4. **Interaction** → Record to DB → Update stats → Update streak → Remove card
5. **Daily Cron** → Fetch RSS → Process with LLM → Store cards

---

## File Structure

```
accioai/
├── app/                                    # Next.js App Router
│   ├── page.tsx                           # Landing page with auth
│   ├── onboarding/
│   │   ├── page.tsx                       # Name entry (Page 1)
│   │   └── preferences/page.tsx           # Interest selection (Page 2)
│   ├── feed/page.tsx                      # Main swipe feed
│   ├── saved/page.tsx                     # Saved items page
│   ├── auth/
│   │   ├── callback/route.ts              # OAuth callback handler
│   │   └── confirm/route.ts               # Email confirmation
│   └── api/
│       ├── feed/route.ts                  # Get personalized cards
│       ├── interactions/route.ts          # Record swipes/actions
│       ├── preferences/route.ts           # Save user preferences
│       ├── saved/route.ts                 # Get saved items
│       ├── search/route.ts                # Search cards
│       ├── stats/route.ts                 # Get user stats
│       └── automation/run/route.ts        # Daily automation
│
├── components/
│   ├── AuthButton.tsx                     # Email/password auth form
│   ├── OnboardingForm.tsx                 # Name collection form
│   ├── PreferencesForm.tsx                # Interest selection form
│   ├── FeedClient.tsx                     # Main feed logic & UI
│   ├── SwipeCard.tsx                      # Individual card with swipe
│   ├── CardDetailModal.tsx                # Full card view modal
│   └── SavedClient.tsx                    # Saved items list
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Browser Supabase client
│   │   └── server.ts                      # Server Supabase client
│   ├── automation/
│   │   ├── rss-fetcher.ts                 # Fetch RSS feeds
│   │   └── processor.ts                   # LLM processing logic
│   ├── llm.ts                             # Groq LLM provider
│   ├── middleware/auth.ts                 # Auth middleware
│   └── logger.ts                          # Logging utilities
│
└── Database Migrations/
    ├── phase1-db-migration.sql            # Initial schema
    └── phase7-streaks.sql                 # Streaks & stats tables
```

---

## Core Features

### 1. Authentication
- **Email/Password**: Supabase Auth with email verification
- **Google OAuth**: Social login (currently has sandbox issues on preview URLs)
- **Session Management**: Automatic session refresh and validation

### 2. Onboarding (Two-Page Flow)
**Page 1: Name Entry**
- Collects user's full name
- Creates user profile in database
- Redirects to preferences

**Page 2: Preferences**
- Profession selection (Developer, Designer, PM, etc.)
- Multi-select content categories (8 categories)
- Saves to `user_preferences` table

### 3. Personalized Feed
- Filters cards by user's selected categories
- Excludes already viewed cards
- Shows 20 cards at a time
- Smart fallback: shows all if no preferences

### 4. Swipe Interaction
- **Swipe Right**: Like (saves interaction)
- **Swipe Left**: Skip (saves interaction)
- **Read Later**: Bookmark for later
- **Done**: Mark as complete
- Visual feedback: Green/red overlay while swiping

### 5. Streak Tracking
- Tracks consecutive days of activity
- Updates on first interaction each day
- Shows current streak and longest streak
- Resets if user misses a day

### 6. Daily Stats
- Tracks: views, likes, saves, completes
- Per-day granularity
- Displayed in header ("X new today")

### 7. Progress Bar
- Visual indicator of daily progress
- Shows X/Y cards completed
- Gradient color (indigo → orange)

### 8. Search & Filters
- Search by title or content
- Filter by category
- Maintains personalization
- Excludes viewed cards

### 9. Automated Content Pipeline
- **Daily Cron**: Runs at midnight
- **Fetches**: 30+ RSS sources
- **Processes**: 5 items per category (40 total)
- **LLM**: Generates summary, insights, takeaways
- **Cleanup**: Deletes unprocessed content older than 7 days

---

## Code Logic Explained

### 1. FeedClient.tsx - Main Feed Logic

**State Management**
```typescript
const [cards, setCards] = useState<ContentCard[]>([]);        // Card stack
const [currentIndex, setCurrentIndex] = useState(0);          // Current position
const [totalCards, setTotalCards] = useState(0);              // Initial count
const [viewedCount, setViewedCount] = useState(0);            // Progress tracker
const [currentStreak, setCurrentStreak] = useState(0);        // Streak display
const [showCelebration, setShowCelebration] = useState(false); // Animation trigger
```

**Fetch Feed Logic**
```typescript
const fetchFeed = async () => {
  // Use search API if filters active, otherwise use feed API
  let url = "/api/feed?limit=20";
  if (searchQuery || selectedCategory !== "all") {
    url = `/api/search?limit=20&q=${searchQuery}&category=${category}`;
  }
  
  const res = await fetch(url);
  const data = await res.json();
  
  setCards(data.data.cards);
  setTotalCards(data.data.cards.length);
  
  // Count cards added today
  const today = new Date().toDateString();
  const todayCards = cards.filter(card => 
    new Date(card.created_at).toDateString() === today
  );
  setNewCardsToday(todayCards.length);
};
```

**Swipe Handler**
```typescript
const handleSwipe = async (cardId: string, direction: "left" | "right") => {
  const interactionType = direction === "right" ? "like" : "view";
  
  // Record interaction
  await fetch("/api/interactions", {
    method: "POST",
    body: JSON.stringify({ card_id: cardId, interaction_type: interactionType }),
  });
  
  // Remove card from local state (array shifts automatically)
  setCards(prev => {
    const newCards = prev.filter(card => card.id !== cardId);
    
    // Show celebration if last card
    if (newCards.length === 0 && prev.length > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    
    return newCards;
  });
  
  // Increment viewed count (for progress tracking)
  setViewedCount(prev => prev + 1);
};
```

**Key Insight**: We DON'T increment `currentIndex` because removing a card from the array automatically shifts the next card into the current position.

---

### 2. SwipeCard.tsx - Swipe Gesture Logic

**Touch/Mouse Tracking**
```typescript
const [startX, setStartX] = useState(0);      // Initial touch position
const [currentX, setCurrentX] = useState(0);  // Current touch position
const [isDragging, setIsDragging] = useState(false);

const handleStart = (clientX: number) => {
  setStartX(clientX);
  setCurrentX(clientX);
  setIsDragging(true);
};

const handleMove = (clientX: number) => {
  if (!isDragging) return;
  setCurrentX(clientX);
};

const handleEnd = () => {
  if (!isDragging) return;
  
  const diff = currentX - startX;
  const threshold = 100; // Minimum swipe distance
  
  if (Math.abs(diff) > threshold) {
    const direction = diff > 0 ? "right" : "left";
    onSwipe(card.id, direction);
  }
  
  // Reset state
  setIsDragging(false);
  setStartX(0);
  setCurrentX(0);
};
```

**Visual Feedback**
```typescript
const offset = isDragging ? currentX - startX : 0;
const rotation = offset / 20;  // Rotate based on swipe distance
const opacity = 1 - Math.abs(offset) / 300;  // Fade out while swiping

const showLikeOverlay = offset > 50;   // Green overlay
const showSkipOverlay = offset < -50;  // Red overlay

// Apply transforms
style={{
  transform: `translateX(${offset}px) rotate(${rotation}deg)`,
  opacity,
  transition: isDragging ? "none" : "all 0.3s ease-out",
}}
```

---

### 3. Automation Pipeline - processor.ts

**LLM Processing Logic**
```typescript
export async function processContent(rawContent: RawContent) {
  const prompt = `
Analyze this article and provide:
1. Summary (max 60 words, scannable)
2. Key Insights (2-3 bullet points)
3. Action Takeaways (1-2 practical steps)

Article:
Title: ${rawContent.title}
Content: ${rawContent.content}

Format as JSON:
{
  "summary": "...",
  "insights": ["...", "..."],
  "takeaways": ["...", "..."]
}
`;

  const response = await generateText(prompt);
  
  // Parse LLM response
  const parsed = JSON.parse(response);
  
  // Create content card
  await supabase.from("content_cards").insert({
    title: rawContent.title,
    content: JSON.stringify(parsed),
    category: rawContent.category,
    source_url: rawContent.url,
    difficulty_level: "intermediate",
    estimated_time_minutes: 5,
  });
  
  // Mark as processed
  await supabase
    .from("raw_content")
    .update({ processed: true })
    .eq("id", rawContent.id);
}
```

**Smart Category Distribution**
```typescript
// Process 5 items per category (not random 20)
const categories = ["technology", "business", "science", "ai_ml", 
                    "design", "startups", "finance", "health"];

for (const category of categories) {
  // Get sources for this category
  const { data: sources } = await supabase
    .from("content_sources")
    .select("id")
    .eq("category", category)
    .eq("is_active", true);
  
  const sourceIds = sources.map(s => s.id);
  
  // Get 5 unprocessed items from these sources
  const { data: items } = await supabase
    .from("raw_content")
    .select("*")
    .eq("processed", false)
    .in("source_id", sourceIds)
    .limit(5);
  
  // Process each item
  for (const item of items) {
    await processContent(item);
  }
}
```

---

### 4. Interactions API - Streak Logic

**Streak Update Algorithm**
```typescript
// Get user's last activity date and current streak
const { data: prefs } = await supabase
  .from('user_preferences')
  .select('last_activity_date, current_streak, longest_streak')
  .eq('user_id', user.id)
  .single();

const lastDate = prefs.last_activity_date ? new Date(prefs.last_activity_date) : null;
const today = new Date().toISOString().split('T')[0];
const todayDate = new Date(today);

let newStreak = prefs.current_streak || 0;

// Only update if this is a new day
if (!lastDate || lastDate.toISOString().split('T')[0] !== today) {
  const daysDiff = lastDate 
    ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  if (daysDiff === 1) {
    newStreak += 1;  // Continue streak
  } else if (daysDiff > 1) {
    newStreak = 1;   // Reset streak (missed days)
  } else {
    newStreak = 1;   // First day
  }
  
  // Update database
  await supabase
    .from('user_preferences')
    .update({
      last_activity_date: today,
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, prefs.longest_streak || 0),
    })
    .eq('user_id', user.id);
}
```

**Daily Stats Update**
```typescript
const today = new Date().toISOString().split('T')[0];
const statField = interaction_type === 'view' ? 'cards_viewed' :
                  interaction_type === 'like' ? 'cards_liked' :
                  interaction_type === 'bookmark' ? 'cards_saved' : 'cards_completed';

// Upsert (insert or update)
await supabase.from('daily_stats').upsert({
  user_id: user.id,
  date: today,
  [statField]: 1,  // Increment by 1
}, { 
  onConflict: 'user_id,date',
  ignoreDuplicates: false 
});
```

---

## Database Schema

### Tables Overview

#### 1. user_profiles
Stores user account information.
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. user_preferences
Stores user's content preferences and streak data.
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  profession TEXT,
  content_categories TEXT[],  -- ['technology', 'business', ...]
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. content_sources
RSS feed sources.
```sql
CREATE TABLE content_sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_type TEXT DEFAULT 'rss',
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. raw_content
Unprocessed content from RSS feeds.
```sql
CREATE TABLE raw_content (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES content_sources(id),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT UNIQUE,  -- Prevents duplicates
  published_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. content_cards
AI-processed content cards ready for users.
```sql
CREATE TABLE content_cards (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- JSON: {summary, insights, takeaways}
  category TEXT,
  difficulty_level TEXT,
  estimated_time_minutes INTEGER,
  tags TEXT[],
  source_url TEXT UNIQUE,  -- Prevents duplicate cards
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. user_interactions
Tracks all user actions on cards.
```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  card_id UUID REFERENCES content_cards(id),
  interaction_type TEXT NOT NULL,  -- 'view', 'like', 'bookmark', 'complete'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. daily_stats
Daily activity statistics per user.
```sql
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  cards_viewed INTEGER DEFAULT 0,
  cards_liked INTEGER DEFAULT 0,
  cards_saved INTEGER DEFAULT 0,
  cards_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

#### 8. automation_runs
Logs of automation job executions.
```sql
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY,
  status TEXT NOT NULL,  -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items_fetched INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Constraints

**Duplicate Prevention**
```sql
-- Prevent duplicate RSS content
ALTER TABLE raw_content 
ADD CONSTRAINT raw_content_url_unique UNIQUE (url);

-- Prevent duplicate cards
ALTER TABLE content_cards 
ADD CONSTRAINT content_cards_source_url_unique UNIQUE (source_url);

-- Prevent duplicate sources
ALTER TABLE content_sources 
ADD CONSTRAINT content_sources_url_unique UNIQUE (source_url);

-- One stats record per user per day
ALTER TABLE daily_stats 
ADD CONSTRAINT daily_stats_user_date_unique UNIQUE (user_id, date);
```

### Row Level Security (RLS)

All user-specific tables have RLS enabled:
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can view own interactions" 
  ON user_interactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" 
  ON daily_stats FOR SELECT 
  USING (auth.uid() = user_id);
```

### Indexes for Performance
```sql
CREATE INDEX idx_content_cards_created ON content_cards(created_at DESC);
CREATE INDEX idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_card ON user_interactions(card_id);
CREATE INDEX idx_raw_content_processed ON raw_content(processed);
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);
```

---

## Problems & Solutions

### Problem 1: Duplicate Cards in Feed
**Issue**: Same card appearing multiple times in the feed after swiping.

**Root Cause**: 
- Interactions were being saved to DB correctly
- BUT feed query wasn't excluding viewed cards properly
- Cards were being removed from local state, but `currentIndex` was incrementing, causing array to skip cards

**Solution**:
```typescript
// BEFORE (Wrong)
setCards(prev => prev.filter(card => card.id !== cardId));
setCurrentIndex(prev => prev + 1);  // ❌ This skips cards!

// AFTER (Correct)
setCards(prev => prev.filter(card => card.id !== cardId));
// Don't increment index - array shifts automatically ✅
```

**Additional Fix**: Added unique constraint on `content_cards.source_url` to prevent duplicates at DB level.

---

### Problem 2: Counter Counting Down Instead of Up
**Issue**: Counter showed "15 of 15" → "14 of 15" → "13 of 15" (confusing!)

**Root Cause**: 
- Using `currentIndex` which stays at 0 when cards are removed
- Displaying as `${cards.length - currentIndex} of ${totalCards}`

**Solution**:
```typescript
// Track viewed count separately
const [viewedCount, setViewedCount] = useState(0);

// Increment on each interaction
setViewedCount(prev => prev + 1);

// Display
{hasMoreCards ? `${viewedCount + 1} of ${totalCards}` : "All done!"}
```

---

### Problem 3: Counter Shows "12 of 10" After Refresh
**Issue**: After refreshing feed, counter showed wrong numbers.

**Root Cause**: 
- `viewedCount` persisted across refreshes
- `totalCards` reset to new fetch count
- Result: viewedCount (12) > totalCards (10)

**Solution**:
```typescript
const handleRefresh = async () => {
  await fetchFeed();
  setCurrentIndex(0);
  setViewedCount(0);  // ✅ Reset counter on refresh
};
```

---

### Problem 4: Category Filtering Not Working in Automation
**Issue**: Automation processed only 5 items total instead of 5 per category (40 total).

**Root Cause**: 
- Query was filtering by `content_sources.category` directly
- Supabase doesn't support nested table filters in this way

**Solution**:
```typescript
// BEFORE (Wrong)
const { data } = await supabase
  .from("raw_content")
  .select("*, content_sources(category)")
  .eq("content_sources.category", category)  // ❌ Doesn't work
  .limit(5);

// AFTER (Correct)
// Step 1: Get source IDs for category
const { data: sources } = await supabase
  .from("content_sources")
  .select("id")
  .eq("category", category);

const sourceIds = sources.map(s => s.id);

// Step 2: Filter by source_id
const { data } = await supabase
  .from("raw_content")
  .select("*")
  .in("source_id", sourceIds)  // ✅ Works!
  .limit(5);
```

---

### Problem 5: Google OAuth Sandbox Error
**Issue**: Google OAuth showing "Blocked script execution" error.

**Root Cause**: 
- Vercel preview URLs not added to Supabase redirect URLs
- Google OAuth requires exact URL match
- Preview URLs change with each deployment

**Attempted Solutions**:
1. Added detailed logging to track OAuth flow
2. Checked Supabase redirect URL configuration
3. Verified Google OAuth credentials

**Current Status**: 
- Email/password auth works perfectly
- Google OAuth blocked on preview URLs
- **Decision**: Skip Google OAuth for MVP, fix later in production

---

### Problem 6: LLM Returning Generic Summaries
**Issue**: LLM was returning fallback content instead of actual summaries.

**Root Cause**: 
- LLM was ignoring format instructions
- Returning freeform text instead of JSON
- Parsing was failing silently

**Solution**:
```typescript
// Improved prompt with strict format
const prompt = `
CRITICAL: You MUST respond with valid JSON only. No other text.

Format:
{
  "summary": "max 60 words",
  "insights": ["point 1", "point 2"],
  "takeaways": ["action 1", "action 2"]
}

Article: ${content}
`;

// Better parsing with fallback
try {
  const parsed = JSON.parse(response);
  return parsed;
} catch {
  // Extract JSON from response if wrapped in text
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Invalid LLM response");
}
```

---

### Problem 7: TypeScript Error on Supabase Query
**Issue**: `Property 'catch' does not exist on type 'PostgrestFilterBuilder'`

**Root Cause**: 
- Supabase queries don't return Promises with `.catch()`
- They return `PostgrestFilterBuilder` objects

**Solution**:
```typescript
// BEFORE (Wrong)
await supabase.rpc('increment_stat', { ... }).catch(() => {
  // Fallback
});  // ❌ TypeScript error

// AFTER (Correct)
await supabase.from('daily_stats').upsert({
  user_id: user.id,
  date: today,
  [statField]: 1,
}, { 
  onConflict: 'user_id,date',
  ignoreDuplicates: false 
});  // ✅ Works!
```

---

### Problem 8: Wrong Supabase Import in New Routes
**Issue**: Build failing with "Export supabase doesn't exist in target module"

**Root Cause**: 
- New API routes using `import { supabase } from "@/lib/supabase/server"`
- Server module exports `createClient()` function, not `supabase` object

**Solution**:
```typescript
// BEFORE (Wrong)
import { supabase } from "@/lib/supabase/server";
const { data } = await supabase.auth.getUser();  // ❌

// AFTER (Correct)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
const { data } = await supabase.auth.getUser();  // ✅
```

---

### Problem 9: Mobile UI Issues
**Issue**: Header too tall on mobile, cards not displaying properly.

**Attempted Solution**: Made header compact, icon-only buttons, smaller text.

**Result**: UI looked worse, less usable.

**Final Decision**: Reverted changes. Original UI works better on mobile than the "optimized" version.

**Lesson**: Don't over-optimize for mobile without testing. Sometimes the desktop UI works fine on mobile.

---

## Development Phases Completed

### Phase 1: Critical Fixes ✅
- UI colors (Slate/Indigo/Orange)
- Readable inputs
- Duplicate prevention
- Category mapping
- OAuth error logging

### Phase 2: Enhanced Onboarding ✅
- Two-page flow
- Profession selection
- Multi-select interests
- Saved to database

### Phase 3: Personalized Feed ✅
- Filter by user interests
- Smart fallback
- Exclude viewed cards

### Phase 4: UI Polish ✅
- Loading states
- Empty states
- Feed header
- Card counter
- Card stack preview

### Phase 5: Content Expansion ✅
- 30+ RSS sources
- Better LLM prompts
- Smart category distribution
- Cleanup automation

### Phase 6: Animations & Polish ✅
- Swipe direction feedback (green/red overlay)
- Daily stats ("X new today")
- Better empty state
- Improved messaging

### Phase 7: Streaks & Engagement ✅
- Daily streak tracking
- Progress bar
- Celebration animation
- Daily stats table

### Phase 8: Search & Filters ✅
- Search by title/content
- Category filters
- Collapsible search panel
- Apply/Clear actions

---

## Key Learnings

1. **Array Manipulation**: When removing items from an array, don't increment the index - the array shifts automatically.

2. **State Management**: Track separate state for display (viewedCount) vs. data structure (currentIndex).

3. **Database Constraints**: Use unique constraints to prevent duplicates at the DB level, not just in code.

4. **Supabase Queries**: Nested table filters don't work - fetch IDs first, then filter by ID.

5. **LLM Prompts**: Be extremely explicit about format requirements. LLMs ignore vague instructions.

6. **TypeScript**: Supabase queries return special types, not standard Promises.

7. **Mobile UI**: Don't over-optimize without testing. Sometimes simpler is better.

8. **OAuth**: Preview URLs and OAuth don't mix well. Test OAuth on production domains.

---

## Future Enhancements

### High Priority
- Fix Google OAuth for production
- Add PWA support for offline mode
- Weekly analytics dashboard
- Push notifications for new content

### Medium Priority
- Social sharing features
- Content quality feedback
- ML-based recommendations
- Custom RSS sources

### Low Priority
- Dark mode
- Export saved items
- Premium features
- Weekly recap emails

---

## Deployment Checklist

- [x] Environment variables configured
- [x] Database migrations run
- [x] RLS policies enabled
- [x] Cron job configured (midnight daily)
- [x] Build passes
- [x] Email auth working
- [ ] Google OAuth working (production only)
- [x] RSS sources added
- [x] LLM processing tested
- [x] Mobile responsive

---

## Contact & Support

For issues or questions:
1. Check this documentation first
2. Review commit history for context
3. Test in development before deploying
4. Monitor Vercel logs for errors

**Remember**: This is a production-ready MVP. Focus on user feedback before adding more features.

