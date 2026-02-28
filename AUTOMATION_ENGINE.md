# Daily Content Automation Engine

## ✅ Implementation Complete

The automated AI-powered content consumption engine is now fully operational.

---

## 📋 What Was Built

### 1. Automation API Endpoint
**Route**: `POST /api/automation/run`

**Features**:
- Creates `automation_runs` entry with status tracking
- Fetches active RSS content sources
- Pulls articles from RSS feeds
- Stores raw content in database
- Processes content with LLM
- Generates content cards
- Updates run status (completed/failed)

### 2. RSS Content Fetching
**Service**: `lib/automation/rss-fetcher.ts`

**Capabilities**:
- Parses RSS/Atom feeds using `rss-parser`
- Extracts title, content, URL, publish date
- Handles feed timeouts (10s)
- Fetches up to 10 most recent items per source
- Deduplicates by URL
- Full error handling

### 3. LLM Content Processing
**Service**: `lib/automation/processor.ts`

**Processing Pipeline**:
1. Sends content to Groq LLM
2. Generates structured output:
   - **Summary**: 2-3 sentence overview
   - **Insights**: 3 key bullet points
   - **Action Takeaway**: 1 actionable item
3. Extracts metadata:
   - Category mapping
   - Difficulty level (beginner/intermediate/advanced)
   - Reading time estimation
4. Fallback handling if LLM fails

### 4. Authentication & Security
- Protected with authentication middleware
- **CRON Secret Bypass**: Header `x-cron-secret` allows scheduled execution
- No modification to existing auth logic

---

## 🗄️ Database Tables

### automation_runs
Tracks each automation execution:
```typescript
{
  id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  items_fetched: number;
  items_processed: number;
  error_message: string | null;
}
```

### content_sources
RSS feed sources:
```typescript
{
  id: string;
  name: string;
  source_type: "rss" | "api" | "manual";
  source_url: string;
  category: string;
  is_active: boolean;
  fetch_frequency_hours: number;
  last_fetched_at: string | null;
  created_at: string;
}
```

### raw_content
Fetched articles before processing:
```typescript
{
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string;
  published_at: string;
  processed: boolean;
  created_at: string;
}
```

### content_cards
Processed, AI-enhanced content:
```typescript
{
  id: string;
  title: string;
  content: string; // Includes summary, insights, takeaway
  category: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  tags: string[];
  created_at: string;
}
```

---

## 🔄 Automation Flow

```
1. API Called (CRON or authenticated user)
   ↓
2. Create automation_runs entry (status: "running")
   ↓
3. Fetch active content_sources (is_active = true, source_type = "rss")
   ↓
4. For each source:
   - Parse RSS feed
   - Extract articles
   - Check for duplicates (by URL)
   - Insert into raw_content (processed = false)
   - Update source.last_fetched_at
   ↓
5. Update automation_runs.items_fetched
   ↓
6. Fetch unprocessed raw_content (limit 20)
   ↓
7. For each unprocessed item:
   - Send to LLM (Groq)
   - Parse JSON response
   - Extract summary, insights, takeaway
   - Calculate metadata (category, difficulty, reading time)
   - Create content_card
   - Mark raw_content.processed = true
   ↓
8. Update automation_runs:
   - status: "completed"
   - items_processed: count
   - completed_at: timestamp
   ↓
9. Return success response
```

---

## 🚀 Usage

### Manual Trigger (Authenticated)

```bash
curl -X POST http://localhost:3000/api/automation/run \
  -H "Cookie: sb-access-token=..."
```

### CRON Trigger (Scheduled)

```bash
curl -X POST http://localhost:3000/api/automation/run \
  -H "x-cron-secret: your_secret_here"
```

### Response

```json
{
  "success": true,
  "data": {
    "runId": "uuid",
    "itemsFetched": 15,
    "itemsProcessed": 10
  }
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# .env.local
CRON_SECRET=your_secure_random_string_here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Content Sources Setup

Insert RSS sources into `content_sources` table:

```sql
INSERT INTO content_sources (name, source_type, source_url, category, is_active, fetch_frequency_hours)
VALUES 
  ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', 'tech', true, 6),
  ('Hacker News', 'rss', 'https://hnrss.org/frontpage', 'tech', true, 4),
  ('MIT News', 'rss', 'https://news.mit.edu/rss/feed', 'science', true, 12);
```

---

## 🤖 LLM Processing

### Prompt Template

```
Analyze this article and provide:
1. A concise summary (2-3 sentences)
2. Three key insights (bullet points)
3. One actionable takeaway

Article Title: [title]
Article Content: [content]

Respond in JSON format:
{
  "summary": "...",
  "insights": ["...", "...", "..."],
  "action_takeaway": "..."
}
```

### Output Format

Generated content card:
```
[Summary paragraph]

**Key Insights:**
• [Insight 1]
• [Insight 2]
• [Insight 3]

**Action Takeaway:**
[Actionable item]
```

### Fallback Behavior

If LLM fails:
- Summary: First 200 characters + "..."
- Insights: Generic placeholders
- Takeaway: "Review the full article for more details"

---

## 📊 Metadata Extraction

### Category Mapping
```typescript
tech → technology
business → business
science → science
health → health
news → general
* → general (default)
```

### Difficulty Calculation
```typescript
< 300 words → beginner
300-800 words → intermediate
> 800 words → advanced
```

### Reading Time
```typescript
words / 200 = minutes
Min: 1 minute
Max: 30 minutes
```

---

## 🔒 Security Features

### CRON Secret Bypass
- Header: `x-cron-secret`
- Compared against `process.env.CRON_SECRET`
- Allows scheduled execution without user auth
- Secure for automated workflows

### Authentication
- Regular API calls require authentication
- Uses existing `requireAuth` middleware
- No changes to auth logic

### Error Handling
- All errors caught and logged
- Automation run marked as "failed"
- Error message stored in database
- No sensitive data leaked

---

## 📈 Performance Considerations

### Rate Limiting
- Fetches max 10 articles per source
- Processes max 20 items per run
- Prevents overwhelming the system

### Deduplication
- Checks existing URLs before inserting
- Prevents duplicate content
- Efficient database queries

### Timeouts
- RSS fetch: 10 seconds
- LLM processing: 30 seconds (from existing config)
- Graceful failure handling

---

## 🧪 Testing

### Test Manual Execution

```bash
# 1. Add test RSS source
INSERT INTO content_sources (name, source_type, source_url, category, is_active, fetch_frequency_hours)
VALUES ('Test Feed', 'rss', 'https://hnrss.org/newest', 'tech', true, 1);

# 2. Run automation (authenticated)
curl -X POST http://localhost:3000/api/automation/run \
  -H "Cookie: sb-access-token=..."

# 3. Check results
SELECT * FROM automation_runs ORDER BY started_at DESC LIMIT 1;
SELECT * FROM raw_content WHERE processed = false;
SELECT * FROM content_cards ORDER BY created_at DESC LIMIT 5;
```

### Test CRON Execution

```bash
# Set CRON_SECRET in .env.local
CRON_SECRET=test_secret_123

# Run with secret
curl -X POST http://localhost:3000/api/automation/run \
  -H "x-cron-secret: test_secret_123"

# Should succeed without authentication
```

### Test Error Handling

```bash
# Invalid RSS URL
INSERT INTO content_sources (name, source_type, source_url, category, is_active, fetch_frequency_hours)
VALUES ('Bad Feed', 'rss', 'https://invalid-url.com/feed', 'tech', true, 1);

# Run automation - should handle gracefully
curl -X POST http://localhost:3000/api/automation/run \
  -H "x-cron-secret: test_secret_123"

# Check automation_runs for error_message
```

---

## 📅 Scheduling with Vercel Cron

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/automation/run",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours.

### Cron Schedule Examples

```
0 */6 * * *   - Every 6 hours
0 8,20 * * *  - 8 AM and 8 PM daily
0 9 * * 1-5   - 9 AM weekdays only
*/30 * * * *  - Every 30 minutes
```

---

## 🔍 Monitoring

### Check Automation Status

```sql
-- Recent runs
SELECT * FROM automation_runs 
ORDER BY started_at DESC 
LIMIT 10;

-- Failed runs
SELECT * FROM automation_runs 
WHERE status = 'failed' 
ORDER BY started_at DESC;

-- Processing stats
SELECT 
  DATE(started_at) as date,
  COUNT(*) as runs,
  SUM(items_fetched) as total_fetched,
  SUM(items_processed) as total_processed
FROM automation_runs
WHERE status = 'completed'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### Check Content Status

```sql
-- Unprocessed content
SELECT COUNT(*) FROM raw_content WHERE processed = false;

-- Recent content cards
SELECT title, category, created_at 
FROM content_cards 
ORDER BY created_at DESC 
LIMIT 10;

-- Content by category
SELECT category, COUNT(*) 
FROM content_cards 
GROUP BY category;
```

---

## 🐛 Troubleshooting

### No Content Fetched

**Cause**: No active RSS sources or invalid URLs

**Solution**:
```sql
-- Check active sources
SELECT * FROM content_sources WHERE is_active = true;

-- Test RSS URL manually
curl -I https://your-rss-feed-url.com/feed
```

### LLM Processing Fails

**Cause**: Invalid API key or rate limits

**Solution**:
- Check `GROQ_API_KEY` in `.env.local`
- Verify Groq API status
- Check logs for error details
- Fallback processing will still create cards

### Duplicate Content

**Cause**: URL changed or query parameters

**Solution**:
- Deduplication checks URL exactly
- Consider normalizing URLs
- Add custom deduplication logic if needed

### CRON Secret Not Working

**Cause**: Secret mismatch or not set

**Solution**:
```bash
# Verify secret is set
echo $CRON_SECRET

# Check header matches exactly
curl -X POST http://localhost:3000/api/automation/run \
  -H "x-cron-secret: $CRON_SECRET" \
  -v
```

---

## 📦 Dependencies

### New Package
- `rss-parser@^3.13.0` - RSS/Atom feed parsing

### Existing Packages
- `@supabase/supabase-js` - Database operations
- `@supabase/ssr` - Server-side auth
- Groq LLM (via existing provider)

---

## ✅ Verification Checklist

- [x] Automation API endpoint created
- [x] RSS fetching implemented
- [x] Raw content storage working
- [x] LLM processing implemented
- [x] Content cards generation working
- [x] Automation runs tracking
- [x] CRON secret bypass working
- [x] Authentication preserved
- [x] Error handling complete
- [x] Logging structured
- [x] Types added
- [x] Dependencies installed
- [x] Build passes
- [x] Type check passes
- [x] ESLint passes

---

**Daily Content Automation Engine is ready for production use!**
