# Supabase Cache Setup for Global Campus Data

## Overview

The global campus data cache now uses **Supabase** for persistent storage, so it survives Vercel serverless function restarts.

## Setup Instructions

### Step 1: Create Cache Table in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Paste this SQL:

```sql
-- Create campus_data_cache table
CREATE TABLE IF NOT EXISTS campus_data_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campus_data_cache_key ON campus_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_campus_data_cache_updated ON campus_data_cache(updated_at);

-- Enable Row Level Security
ALTER TABLE campus_data_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for read/write access (using anon key)
CREATE POLICY "Allow public read/write access" ON campus_data_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

5. Click **Run** to execute

### Step 2: Verify Table Created

1. Go to **Table Editor** → **campus_data_cache**
2. You should see an empty table with columns:
   - `id` (bigint)
   - `cache_key` (text)
   - `data` (jsonb)
   - `updated_at` (timestamptz)
   - `created_at` (timestamptz)

### Step 3: That's It!

The cache will automatically:
- ✅ Save to Supabase when data is fetched
- ✅ Load from Supabase on cold starts
- ✅ Use in-memory cache when available (fastest)
- ✅ Fall back to Supabase if in-memory cache expired

## How It Works

### Cache Flow:

```
User Request
    ↓
Check In-Memory Cache (fastest)
    ↓ (miss/expired)
Check Supabase Cache (persistent)
    ↓ (hit) → Restore to in-memory → Return
    ↓ (miss/expired)
Fetch All Campuses
    ↓
Save to In-Memory Cache
    ↓
Save to Supabase (async, non-blocking)
    ↓
Return Result
```

### Benefits:

1. **Survives Restarts:** Cache persists in Supabase across Vercel function restarts
2. **Fast Lookups:** In-memory cache used when available (10-50ms)
3. **Automatic:** No manual intervention needed
4. **Reliable:** Falls back gracefully if Supabase unavailable

## Cache Structure in Supabase

```json
{
  "cache_key": "24-11-2025",
  "data": {
    "RA2311003012253": [
      {
        "ra": "RA2311003012253",
        "session": "Forenoon",
        "hall": "TP-401",
        "bench": "A12",
        "campus": "Tech Park",
        ...
      }
    ],
    "RA2311003012254": [...],
    ...
  },
  "updated_at": "2025-11-24T10:00:00Z"
}
```

## Cache TTL

- **Duration:** 1 hour (3,600,000 milliseconds)
- **Auto-refresh:** When cache expires, next request triggers refresh
- **Storage:** Both in-memory (fast) and Supabase (persistent)

## Troubleshooting

### "Table does not exist"
- Run the SQL script from Step 1

### "Permission denied"
- Check Row Level Security policy allows SELECT/INSERT/UPDATE
- Verify your Supabase anon key is correct

### Cache not persisting
- Check Supabase connection in logs
- Verify `campus_data_cache` table exists
- Check environment variables are set

### Cache too large
- Supabase free tier: 500MB database
- Each cache entry: ~1-10MB (depends on number of students)
- Cache auto-expires after 1 hour

## Manual Cache Management

### Clear Cache (if needed):

```sql
-- Clear all cache
DELETE FROM campus_data_cache;

-- Clear specific date cache
DELETE FROM campus_data_cache WHERE cache_key = '24-11-2025';
```

### View Cache Stats:

```sql
-- Count cache entries
SELECT COUNT(*) FROM campus_data_cache;

-- View cache sizes
SELECT 
  cache_key,
  pg_size_pretty(pg_column_size(data)) as size,
  updated_at
FROM campus_data_cache
ORDER BY updated_at DESC;
```

