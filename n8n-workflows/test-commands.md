# Social Media Content Pipeline - Test Commands

## Your Brand IDs (copy these)

| Brand | ID |
|-------|-----|
| **MurphbeckTech** | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| **Mural Ride** | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| **Licenr** | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| **StoreScorer** | `d4e5f6a7-b8c9-0123-defa-456789012345` |
| **AsherAI** | `e5f6a7b8-c9d0-1234-efab-567890123456` |

---

## Test Requests (Replace YOUR_WEBHOOK_URL)

### Test 1: MurphbeckTech - Instagram Carousel
```bash
curl -X POST YOUR_WEBHOOK_URL/webhook/content-request \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "platform": "instagram",
    "content_type": "carousel",
    "topic": "5 ways AI is changing small business operations",
    "notes": "Focus on practical, actionable tips"
  }'
```

### Test 2: Mural Ride - TikTok Video
```bash
curl -X POST YOUR_WEBHOOK_URL/webhook/content-request \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "platform": "tiktok",
    "content_type": "video",
    "topic": "Behind the scenes of a mural installation",
    "notes": "Make it energetic and inspiring"
  }'
```

### Test 3: Licenr - LinkedIn Post
```bash
curl -X POST YOUR_WEBHOOK_URL/webhook/content-request \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "platform": "linkedin",
    "content_type": "post",
    "topic": "Why proper licensing matters for your business",
    "notes": "Professional tone, include statistics if possible"
  }'
```

### Test 4: StoreScorer - Twitter Thread
```bash
curl -X POST YOUR_WEBHOOK_URL/webhook/content-request \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "d4e5f6a7-b8c9-0123-defa-456789012345",
    "platform": "twitter",
    "content_type": "thread",
    "topic": "3 metrics every retail store should track weekly",
    "notes": "Data-driven, include specific examples"
  }'
```

### Test 5: AsherAI - Instagram Reel
```bash
curl -X POST YOUR_WEBHOOK_URL/webhook/content-request \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "e5f6a7b8-c9d0-1234-efab-567890123456",
    "platform": "instagram",
    "content_type": "reel",
    "topic": "AI tools you should be using in 2025",
    "notes": "Fun, accessible, not too technical"
  }'
```

---

## Content Types by Platform

### Instagram
- `image` - Single image post
- `carousel` - Multi-slide post
- `reel` - Short video
- `story` - Story content

### TikTok
- `video` - Standard TikTok video
- `duet` - Duet format
- `stitch` - Stitch format

### LinkedIn
- `post` - Standard post
- `article` - Long-form article
- `document` - PDF carousel

### Twitter/X
- `tweet` - Single tweet
- `thread` - Multi-tweet thread
- `poll` - Poll format

---

## Supabase Connection (for n8n)

After running the SQL, your connection details are:
- **Host:** `db.[your-project-ref].supabase.co`
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** (your project password)
- **Port:** `5432`
- **SSL:** Enabled

---

## Quick Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check brands were created
SELECT id, name FROM brands;

-- Check content drafts (will be empty until you run tests)
SELECT * FROM content_drafts ORDER BY created_at DESC LIMIT 10;
```
