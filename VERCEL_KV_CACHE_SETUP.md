# Vercel Cache Setup (Recommended)

## Overview

Vercel offers multiple storage options. For caching, **Upstash Redis** (via Marketplace) is the best choice - it's serverless Redis perfect for caching.

## Vercel Storage Options

1. **Upstash Redis** ⭐ (Recommended for caching - via Marketplace)
   - Serverless Redis
   - Fast, low-latency
   - Perfect for caching
   - Free tier: 10K commands/day
   - Auto-scaling

2. **Vercel Edge Config**
   - Ultra-low latency reads
   - Good for config/feature flags
   - Not ideal for large data

3. **Vercel Blob**
   - Fast object storage
   - For large files
   - Not suitable for structured cache

4. **Supabase** (via Marketplace)
   - Postgres backend
   - Good for structured data
   - Already set up in your project

## Setup Upstash Redis (Recommended)

### Step 1: Add Upstash to Your Project

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Storage** tab
4. Click **Browse Marketplace** or **Add Integration**
5. Search for **Upstash**
6. Click **Add Integration**
7. Follow the setup wizard

### Step 2: Create Redis Database

1. After adding Upstash, you'll be redirected to Upstash dashboard
2. Click **Create Database**
3. Choose:
   - **Name:** `gradex-cache`
   - **Type:** Regional (faster) or Global (multi-region)
   - **Region:** Closest to your users
4. Click **Create**

### Step 3: Configure in Vercel

When setting up the database in Vercel, you'll see:

**Environments:**
- ✅ **Development** - Enable (for local testing)
- ✅ **Preview** - Enable (for preview deployments)
- ✅ **Production** - Enable (for production)

**Custom Prefix (Optional):**
- Leave empty (default) OR
- Use `UPSTASH_REDIS_` (recommended for clarity)

**Default Environment Variables Created:**
- If prefix is `UPSTASH_REDIS`: `UPSTASH_REDIS__KV_REST_API_URL`, `UPSTASH_REDIS__KV_REST_API_TOKEN`
- If no prefix: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- Also includes: `UPSTASH_REDIS__REDIS_URL`, `UPSTASH_REDIS__KV_URL` (for direct Redis connections)

**Recommendation:**
- ✅ Enable all environments (Development, Preview, Production)
- ✅ Use prefix `UPSTASH_REDIS` (recommended for clarity)
- ✅ Environment variables are automatically added to your project
- ✅ Code automatically detects the variable names

### Step 4: Install Package

```bash
npm install @upstash/redis
```

### Step 5: Verify Environment Variables

1. In Vercel dashboard → **Settings** → **Environment Variables**
2. Verify these are present:
   - `UPSTASH_REDIS_REST_URL` (or your custom prefix)
   - `UPSTASH_REDIS_REST_TOKEN` (or your custom prefix)

**Note:** If you used a custom prefix, update the code to use those variable names, or the code will automatically detect the standard names.

## Pricing (Upstash)

- **Free Tier:** 10,000 commands/day, 256 MB storage
- **Pay-as-you-go:** $0.20 per 100K commands
- **No cold starts:** Always warm

## Benefits Over Supabase

✅ **Purpose-Built for Caching:** Redis is designed for caching  
✅ **Faster:** Lower latency than database queries  
✅ **Serverless:** Auto-scales, pay per use  
✅ **Redis-Compatible:** Standard Redis commands  
✅ **No Cold Starts:** Always available  

## Cache Storage

The cache system uses **Upstash Redis only** (no Supabase fallback):
- ✅ Fast, low-latency Redis storage
- ✅ Automatic TTL (1 hour expiration)
- ✅ Survives serverless function restarts
- ✅ Scales automatically

