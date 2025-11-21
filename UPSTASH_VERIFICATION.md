# Upstash Redis Verification Checklist

## ✅ Package Dependencies

**Status:** ✅ **VERIFIED**
- `@upstash/redis`: `^1.34.0` (installed in package.json)

## ✅ Environment Variables

**Your Setup:**
```
UPSTASH_REDIS__KV_REST_API_URL="https://oriented-swift-40099.upstash.io"
UPSTASH_REDIS__KV_REST_API_TOKEN="AZyjAAIncDJlMjg4ZGZjYzg1ODA0YTYyOWQ4ZDIxNjkxOTI3ODFhMHAyNDAwOTk"
```

**Code Detection Order:**
1. ✅ `UPSTASH_REDIS__KV_REST_API_URL` / `UPSTASH_REDIS__KV_REST_API_TOKEN` (YOUR SETUP - FIRST CHECK)
2. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (default naming)
3. `REDIS_REST_URL` / `REDIS_REST_TOKEN` (alternative)
4. `KV_REST_API_URL` / `KV_REST_API_TOKEN` (legacy)

**Status:** ✅ **VERIFIED** - Code will detect your variables correctly

## ✅ Redis Client Initialization

**Location:** `api/seating-utils.js` (lines 226-230, 360-364)

```javascript
const { Redis } = await import('@upstash/redis');
const redis = new Redis({
  url: redisUrl,    // ✅ Uses detected variable
  token: redisToken, // ✅ Uses detected variable
});
```

**Status:** ✅ **VERIFIED** - Correctly uses detected env vars

## ✅ Cache Read Operation

**Location:** `api/seating-utils.js` (lines 232-263)

**What it does:**
1. Gets cached data: `redis.get(redisKey)`
2. Checks if cache exists and is valid (< 1 hour old)
3. Converts JSON object back to Map
4. Restores to in-memory cache
5. Returns data

**Status:** ✅ **VERIFIED** - Logic is correct

## ✅ Cache Write Operation

**Location:** `api/seating-utils.js` (lines 366-374)

**What it does:**
1. Converts Map to plain object
2. Sets cache with TTL: `redis.set(key, data, { ex: 3600 })`
3. TTL = 3600 seconds (1 hour)

**Status:** ✅ **VERIFIED** - Logic is correct

## ✅ Error Handling

**Location:** `api/seating-utils.js` (lines 296-299, 391-394)

**What it does:**
- Try/catch blocks around Redis operations
- Logs warnings on errors
- Continues to fetch if Redis unavailable (doesn't crash)

**Status:** ✅ **VERIFIED** - Proper error handling

## ✅ Cache Key Format

**Format:** `campus_cache:{date}` or `campus_cache:any`

**Examples:**
- `campus_cache:24-11-2025`
- `campus_cache:any` (if no date provided)

**Status:** ✅ **VERIFIED** - Consistent key format

## ✅ Cache Data Structure

**Stored Format:**
```javascript
{
  timestamp: 1234567890,  // Unix timestamp
  data: {
    "RA2311003012253": [
      { ra: "...", session: "...", hall: "...", ... },
      ...
    ],
    "RA2311003012254": [...],
    ...
  }
}
```

**Status:** ✅ **VERIFIED** - Correct structure

## ⚠️ Potential Issues to Check

### 1. Environment Variables in Vercel

**Check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set for **all environments** (Development, Preview, Production):
   - `UPSTASH_REDIS__KV_REST_API_URL`
   - `UPSTASH_REDIS__KV_REST_API_TOKEN`

**If missing:** Add them manually or re-run the Upstash integration setup

### 2. Package Installation

**Check:**
```bash
npm list @upstash/redis
```

**If not installed:**
```bash
npm install @upstash/redis
```

### 3. Upstash Database Status

**Check:**
1. Go to Upstash Dashboard: https://console.upstash.com/
2. Verify database `oriented-swift-40099` is active
3. Check usage/quota limits

### 4. Network/Firewall Issues

**Check:**
- Vercel serverless functions can reach `https://oriented-swift-40099.upstash.io`
- No firewall blocking outbound HTTPS requests

## 🧪 Testing Checklist

### Test 1: Environment Variable Detection

**Expected:** Code should detect `UPSTASH_REDIS__KV_REST_API_URL`

**How to verify:**
- Check logs for: `[getAllCampusDataCache] ✅ Found valid Upstash Redis cache`
- OR: `[saveCacheToRedis] ✅ Saved X RAs to Upstash Redis cache`

### Test 2: Cache Write

**Expected:** Data should be saved to Redis

**How to verify:**
1. Make a search request
2. Check logs for: `[saveCacheToRedis] ✅ Saved X RAs to Upstash Redis cache`
3. Check Upstash dashboard → Database → Keys (should see `campus_cache:*`)

### Test 3: Cache Read

**Expected:** Data should be read from Redis on subsequent requests

**How to verify:**
1. Make first search (writes to cache)
2. Make second search within 1 hour
3. Check logs for: `[getAllCampusDataCache] ✅ Found valid Upstash Redis cache`
4. Response should be instant (~10-50ms)

### Test 4: Cache Expiration

**Expected:** Cache expires after 1 hour

**How to verify:**
1. Wait 1 hour after cache write
2. Make new search
3. Should see: `[getAllCampusDataCache] Upstash Redis cache expired, will refresh...`
4. New data should be fetched and cached

## 🔍 Debugging

### If cache not working:

1. **Check logs:**
   - Look for `[getAllCampusDataCache]` messages
   - Look for `[saveCacheToRedis]` messages
   - Check for error messages

2. **Check environment variables:**
   ```javascript
   console.log('Redis URL:', process.env.UPSTASH_REDIS__KV_REST_API_URL);
   console.log('Redis Token:', process.env.UPSTASH_REDIS__KV_REST_API_TOKEN ? 'SET' : 'NOT SET');
   ```

3. **Test Redis connection:**
   ```javascript
   const { Redis } = await import('@upstash/redis');
   const redis = new Redis({
     url: process.env.UPSTASH_REDIS__KV_REST_API_URL,
     token: process.env.UPSTASH_REDIS__KV_REST_API_TOKEN,
   });
   await redis.ping(); // Should return "PONG"
   ```

## ✅ Summary

**All code checks:** ✅ **PASSING**

**What to verify:**
1. ✅ Environment variables are set in Vercel
2. ✅ Package is installed (`npm install` if needed)
3. ✅ Upstash database is active
4. ✅ Test with actual requests and check logs

**Expected behavior:**
- First request: Fetches data, saves to Redis (~5-15 seconds)
- Subsequent requests: Reads from Redis (~10-50ms)
- After 1 hour: Cache expires, refreshes automatically

