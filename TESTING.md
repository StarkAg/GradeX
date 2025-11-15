# Testing Guide for Seating Arrangement API

## What You Need

### 1. **Test Register Numbers (RA)**
   - Valid RA numbers to test with (e.g., "RA23XXXX")
   - Test with different formats: "RA23XXXX", "ra23xxxx", "RA 23 XXXX"

### 2. **Test Dates**
   - Dates in different formats:
     - `15-11-2025` (DD-MM-YYYY)
     - `15/11/2025` (DD/MM/YYYY)
     - `2025-11-15` (YYYY-MM-DD)
   - Today's date
   - Tomorrow's date
   - Future exam dates

### 3. **SRM Exam Cell Access**
   - Verify the SRM exam cell websites are accessible:
     - https://examcell.srmist.edu.in/main/seating/bench/report.php
     - https://examcell.srmist.edu.in/tp/seating/bench/report.php
     - https://examcell.srmist.edu.in/bio/seating/bench/report.php
     - https://examcell.srmist.edu.in/ub/seating/bench/report.php

### 4. **Development Setup**

#### Option A: Test with Vercel CLI (Recommended)
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Run Vercel dev server (handles API routes)
vercel dev
```

#### Option B: Test API Directly
```bash
# Start Vite dev server
npm run dev

# In another terminal, test API endpoint
curl "http://localhost:5173/api/seating?ra=RA23XXXX&date=15-11-2025"
```

### 5. **What to Test**

#### ✅ Basic Functionality
- [ ] API responds to GET requests
- [ ] Returns proper JSON structure
- [ ] Handles missing RA parameter
- [ ] Handles invalid RA format
- [ ] Handles date in different formats
- [ ] CORS headers are set correctly

#### ✅ Scraping Logic
- [ ] Fetches from all 4 campuses
- [ ] Finds RA numbers in HTML
- [ ] Extracts hall/room information
- [ ] Extracts bench numbers
- [ ] Detects session (Forenoon/Afternoon)
- [ ] Handles cases where RA not found

#### ✅ Caching
- [ ] Results are cached for 60 seconds
- [ ] Cache returns same data within TTL
- [ ] Cache expires after 60 seconds
- [ ] Different RA/date combinations have separate cache

#### ✅ Error Handling
- [ ] Handles network errors gracefully
- [ ] Handles timeout (12 seconds)
- [ ] Retries failed requests once
- [ ] Returns proper error messages
- [ ] Falls back gracefully when SRM sites are down

#### ✅ Frontend Integration
- [ ] SeatFinder component calls API
- [ ] Displays results correctly
- [ ] Shows "Last updated" timestamp
- [ ] Auto-refreshes every 1 minute
- [ ] Falls back to static data if API fails
- [ ] Error messages display properly

### 6. **Expected Response Format**

```json
{
  "status": "ok",
  "lastUpdated": "2025-11-16T10:15:00Z",
  "results": {
    "Main Campus": [
      {
        "matched": true,
        "session": "Forenoon",
        "hall": "S45",
        "bench": "A12",
        "context": "RA23XXXX S45 A12 Forenoon...",
        "url": "https://examcell.srmist.edu.in/main/seating/bench/report.php",
        "campus": "Main Campus"
      }
    ],
    "Tech Park": [],
    "Biotech & Architecture": [],
    "University Building": []
  }
}
```

### 7. **Common Issues to Watch For**

1. **CORS Errors**: Make sure CORS headers are set
2. **Timeout Issues**: SRM sites might be slow, 12s timeout should be enough
3. **HTML Structure Changes**: SRM might change their HTML structure
4. **Rate Limiting**: Too many requests might get blocked
5. **Cache Issues**: Clear cache if testing same RA/date repeatedly

### 8. **Debugging Tips**

- Check browser console for errors
- Check Vercel function logs: `vercel logs`
- Test API directly with curl/Postman
- Add console.log in `seating-utils.js` for debugging
- Check network tab in browser DevTools

### 9. **Production Deployment Checklist**

- [ ] All tests pass locally
- [ ] API works on Vercel preview deployment
- [ ] CORS works from production domain
- [ ] Error handling works correctly
- [ ] Caching works as expected
- [ ] Auto-refresh works in production
- [ ] Fallback to static data works

