# AccioAI - Quick Reference

## API Endpoints

### POST /api/chat

**Non-Streaming Request**:
```json
{
  "prompt": "Your question here"
}
```

**Streaming Request**:
```json
{
  "prompt": "Your question here",
  "stream": true
}
```

**Success Response (Non-Streaming)**:
```json
{
  "success": true,
  "data": "Response text here"
}
```

**Success Response (Streaming)**:
```
Content-Type: text/plain; charset=utf-8
[chunks of text streamed progressively]
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `INVALID_INPUT` | Bad request data | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `TIMEOUT` | Request took too long | 400 |
| `PROVIDER_ERROR` | LLM provider issue | 502 |
| `PROVIDER_RATE_LIMIT` | Provider rate limited | 503 |
| `INTERNAL_ERROR` | Unexpected error | 500 |

## Rate Limits

- **Limit**: 5 requests per minute per IP
- **Window**: 60 seconds (sliding)
- **Response**: HTTP 429 when exceeded

## Input Constraints

- **Max Length**: 2000 characters
- **Min Length**: 1 character (after trim)
- **Type**: String only
- **Sanitization**: Control characters removed (except \n and \t)

## Response Limits

- **Max Size**: 10KB (~2000 words)
- **Max Tokens**: 1000 (OpenAI)
- **Timeout**: 30 seconds

## Logging Format

All logs are JSON with this structure:
```json
{
  "timestamp": "2026-02-28T11:30:00.000Z",
  "level": "info|error",
  "message": "Human readable message",
  "requestId": "uuid-here",
  "provider": "OpenAIProvider|MockProvider",
  "latencyMs": 123
}
```

## Development Commands

```bash
# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Build
npm run build

# Start production
npm start
```

## Testing Examples

### Test Non-Streaming
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, world!"}'
```

### Test Streaming
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Tell me a story", "stream": true}' \
  --no-buffer
```

### Test Rate Limiting
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Test"}' &
done
wait
```

### Test Validation
```bash
# Empty prompt (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"   "}'

# Too long (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"'$(python3 -c 'print("a"*2001)')'"}'
```

## Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...        # Optional: Uses mock if missing
ANTHROPIC_API_KEY=...        # Not yet implemented
```

## Architecture Overview

```
Request → Rate Limiter → Validation → Provider → Response
                ↓            ↓           ↓          ↓
              Logger      Logger      Logger    Logger
```

## Provider Fallback

1. If `OPENAI_API_KEY` exists → Use OpenAI
2. If no API key → Use Mock Provider
3. If streaming fails → Fallback to non-streaming
4. If provider errors → Return safe error code

## Production Checklist

- [ ] Add real OpenAI API key
- [ ] Replace in-memory rate limiter with Redis
- [ ] Set up log aggregation (DataDog/CloudWatch)
- [ ] Add authentication/API keys
- [ ] Configure CORS if needed
- [ ] Set up monitoring/alerts
- [ ] Add response caching
- [ ] Configure CDN
- [ ] Set up CI/CD
- [ ] Add health check endpoint

## Support

- See `SCAFFOLD_SUMMARY.md` for initial architecture
- See `PRODUCTION_UPGRADE.md` for upgrade details
- See `README.md` for Next.js basics
