# Automation Engine Quick Start

## 🚀 Setup (5 minutes)

### 1. Set CRON Secret
```bash
# Generate secure secret
openssl rand -base64 32

# Add to .env.local
CRON_SECRET=your_generated_secret_here
```

### 2. Add RSS Sources
```sql
INSERT INTO content_sources (name, source_type, source_url, category, is_active, fetch_frequency_hours)
VALUES 
  ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', 'tech', true, 6),
  ('Hacker News', 'rss', 'https://hnrss.org/frontpage', 'tech', true, 4);
```

### 3. Test Run
```bash
curl -X POST http://localhost:3000/api/automation/run \
  -H "x-cron-secret: your_secret_here"
```

---

## 📡 API Usage

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

## 🔄 What It Does

1. **Fetches** RSS feeds from active sources
2. **Stores** raw articles in database
3. **Processes** with AI to generate:
   - Summary (2-3 sentences)
   - 3 key insights
   - 1 action takeaway
4. **Creates** content cards ready for users
5. **Tracks** everything in automation_runs

---

## 📅 Schedule with Vercel

Create `vercel.json`:
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

Common schedules:
- `0 */6 * * *` - Every 6 hours
- `0 8,20 * * *` - 8 AM and 8 PM
- `0 9 * * 1-5` - 9 AM weekdays

---

## 🔍 Monitor

### Check Recent Runs
```sql
SELECT * FROM automation_runs 
ORDER BY started_at DESC 
LIMIT 5;
```

### Check New Content
```sql
SELECT title, category, created_at 
FROM content_cards 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Unprocessed
```sql
SELECT COUNT(*) FROM raw_content 
WHERE processed = false;
```

---

## 🐛 Troubleshooting

### No Content Fetched
- Check RSS sources are active: `SELECT * FROM content_sources WHERE is_active = true`
- Test RSS URL: `curl -I https://your-feed-url.com/feed`

### Processing Fails
- Check Groq API key: `GROQ_API_KEY` in `.env.local`
- Check logs for errors
- Fallback will still create basic cards

### CRON Not Working
- Verify secret matches: `echo $CRON_SECRET`
- Check header: `-H "x-cron-secret: exact_match"`

---

## 📊 Popular RSS Feeds

### Technology
- TechCrunch: `https://techcrunch.com/feed/`
- Hacker News: `https://hnrss.org/frontpage`
- Ars Technica: `https://feeds.arstechnica.com/arstechnica/index`
- The Verge: `https://www.theverge.com/rss/index.xml`

### Business
- Harvard Business Review: `https://feeds.hbr.org/harvardbusiness`
- Forbes: `https://www.forbes.com/real-time/feed2/`

### Science
- MIT News: `https://news.mit.edu/rss/feed`
- Science Daily: `https://www.sciencedaily.com/rss/all.xml`

### General News
- BBC: `http://feeds.bbci.co.uk/news/rss.xml`
- Reuters: `https://www.reutersagency.com/feed/`

---

## ✅ Quick Checklist

- [ ] CRON_SECRET set in .env.local
- [ ] RSS sources added to database
- [ ] Test run successful
- [ ] Content cards created
- [ ] Schedule configured (optional)
- [ ] Monitoring queries saved

---

**Ready to automate! Run the API and watch content flow in.**
