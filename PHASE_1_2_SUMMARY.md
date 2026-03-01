# Phase 1 & 2 Complete - Ready to Deploy

## What's Done

### Phase 1: Critical Fixes ✅
- **UI Colors**: Slate/Indigo/Orange (50-30-20 rule) applied everywhere
- **Input Text**: Dark, readable text in all input fields
- **Duplicate Prevention**: Database constraint on `raw_content.url`
- **More Content Sources**: Added 5 new RSS feeds (tech, business, science, design)
- **OAuth Error Logging**: Better debugging for Google sign in issues

### Phase 2: Enhanced Onboarding ✅
- **Two-Page Onboarding**:
  - Page 1: Enter name
  - Page 2: Select profession + content interests
- **8 Content Categories**: Technology, Business, Science, AI/ML, Design, Startups, Finance, Health
- **Preferences Saved**: Stored in `user_preferences` table
- **Ready for Personalization**: Feed can now filter by user interests

## Database Changes Required

**Run this in Supabase SQL Editor:**

```sql
-- 1. Add unique constraint to prevent duplicates
ALTER TABLE raw_content 
ADD CONSTRAINT raw_content_url_unique UNIQUE (url);

-- 2. Add unique constraint for content sources
ALTER TABLE content_sources 
ADD CONSTRAINT content_sources_url_unique UNIQUE (source_url);

-- 3. Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profession TEXT,
  content_categories TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 6. Add more RSS sources
INSERT INTO content_sources (name, source_url, category, is_active) VALUES
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'technology', true),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'technology', true),
  ('Harvard Business Review', 'https://hbr.org/feed', 'business', true),
  ('ScienceDaily', 'https://www.sciencedaily.com/rss/all.xml', 'science', true),
  ('Smashing Magazine', 'https://www.smashingmagazine.com/feed/', 'design', true)
ON CONFLICT (source_url) DO NOTHING;
```

## Google OAuth Fix

**Supabase Dashboard → Authentication → Providers → Google:**
- Turn **"Skip nonce checks"** to **ON**
- Save

## Deploy

```bash
git push origin main
```

## New User Flow

1. **Sign up** with email/password or Google
2. **Enter name** (Page 1)
3. **Select profession + interests** (Page 2)
4. **See personalized feed** (filtered by interests - Phase 3)

## What's Next (Phase 3)

- Filter feed by user's selected categories
- Show only content matching user interests
- Better empty states
- Category badges on cards

## Testing Checklist

After deploy:
- [ ] Sign up with email works
- [ ] Input text is readable (dark, not grey)
- [ ] Name entry page works
- [ ] Preferences page shows 8 categories
- [ ] Can select multiple interests
- [ ] Redirects to feed after preferences
- [ ] Google OAuth works (after skip nonce enabled)
- [ ] No duplicate cards in feed
- [ ] New RSS sources fetch content (wait for midnight or trigger manually)

## Color Scheme Applied

**50% Slate:**
- Backgrounds: `slate-50`, `slate-100`
- Text: `slate-600`, `slate-700`, `slate-900`
- Borders: `slate-200`, `slate-300`

**30% Indigo:**
- Primary buttons: `indigo-600`
- Hover states: `indigo-700`
- Focus rings: `indigo-500`

**20% Orange:**
- Accents: `orange-500`, `orange-600`
- Gradients: `from-indigo-600 to-orange-500`
- Category badges: `orange-100`, `orange-700`

## Files Changed

**New Files:**
- `components/PreferencesForm.tsx`
- `app/onboarding/preferences/page.tsx`
- `app/api/preferences/route.ts`
- `phase1-db-migration.sql`
- `GOOGLE_OAUTH_FIX.md`
- `PHASE_1_2_SUMMARY.md` (this file)

**Modified Files:**
- `app/page.tsx` - Colors updated
- `app/onboarding/page.tsx` - Colors updated
- `components/OnboardingForm.tsx` - Redirect to preferences, colors
- `components/AuthButton.tsx` - Input text color, button colors
- `components/SwipeCard.tsx` - Header colors
- `components/CardDetailModal.tsx` - Header colors
- `app/auth/callback/route.ts` - Error logging
- `app/api/automation/run/route.ts` - Simplified duplicate handling

## Known Issues

- **Google OAuth**: May still have issues - check Vercel logs after testing
- **Feed not personalized yet**: Phase 3 will filter by user preferences
- **No empty states**: Will add in Phase 4

## Success Metrics

After deploy, you should see:
- ✅ Clean, consistent UI with indigo/orange colors
- ✅ Readable input fields
- ✅ Two-page onboarding flow
- ✅ User preferences saved
- ✅ No duplicate content in automation
- ✅ More diverse content sources
