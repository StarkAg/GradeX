/**
 * Bot Protection Module (No CAPTCHA)
 * 
 * Implements multiple layers of bot protection:
 * 1. Rate limiting per IP
 * 2. Browser fingerprinting validation
 * 3. Request timing analysis
 * 4. User-Agent validation
 * 5. Header validation
 */

// In-memory rate limit store (for serverless, consider Redis for production)
const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10, // Max 10 requests per minute per IP
  blockDurationMs: 15 * 60 * 1000, // Block for 15 minutes if exceeded
};

const BLOCKED_IPS = new Set(); // Track blocked IPs

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  // Check various headers (Vercel uses x-forwarded-for)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check if IP is rate limited
 */
function checkRateLimit(ip) {
  const now = Date.now();
  
  // Check if IP is blocked
  if (BLOCKED_IPS.has(ip)) {
    const blockInfo = rateLimitStore.get(`blocked:${ip}`);
    if (blockInfo && now < blockInfo.until) {
      return {
        allowed: false,
        reason: 'IP temporarily blocked due to excessive requests',
        retryAfter: Math.ceil((blockInfo.until - now) / 1000),
      };
    } else {
      // Block expired, remove it
      BLOCKED_IPS.delete(ip);
      rateLimitStore.delete(`blocked:${ip}`);
    }
  }
  
  // Get or create rate limit entry
  const key = `ratelimit:${ip}`;
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + RATE_LIMIT_CONFIG.windowMs };
  
  // Reset if window expired
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_CONFIG.windowMs;
  }
  
  // Check limit
  if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
    // Block IP
    BLOCKED_IPS.add(ip);
    rateLimitStore.set(`blocked:${ip}`, {
      until: now + RATE_LIMIT_CONFIG.blockDurationMs,
    });
    
    return {
      allowed: false,
      reason: 'Rate limit exceeded. Too many requests.',
      retryAfter: RATE_LIMIT_CONFIG.blockDurationMs / 1000,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return { allowed: true };
}

/**
 * Validate browser headers and fingerprint
 */
function validateBrowser(req) {
  const userAgent = req.headers['user-agent'] || '';
  const accept = req.headers['accept'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const referer = req.headers['referer'] || '';
  
  // Check for common bot user agents
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /postman/i, /insomnia/i, /httpie/i,
    /^$/i, // Empty user agent
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    // Allow some legitimate bots (Google, Bing, etc.)
    const allowedBots = [/googlebot/i, /bingbot/i, /slurp/i];
    if (!allowedBots.some(pattern => pattern.test(userAgent))) {
      return {
        valid: false,
        reason: 'Suspicious user agent detected',
      };
    }
  }
  
  // Check for missing common browser headers
  const missingHeaders = [];
  if (!accept || !accept.includes('text/html') && !accept.includes('*/*')) {
    missingHeaders.push('accept');
  }
  if (!acceptLanguage) {
    missingHeaders.push('accept-language');
  }
  if (!acceptEncoding) {
    missingHeaders.push('accept-encoding');
  }
  
  // Too many missing headers might indicate a bot
  if (missingHeaders.length >= 2) {
    return {
      valid: false,
      reason: 'Missing required browser headers',
    };
  }
  
  // Check for suspicious referer patterns
  if (referer && !referer.includes('gradex') && !referer.includes('localhost')) {
    // Could be suspicious, but not blocking for now
  }
  
  return { valid: true };
}

/**
 * Validate request timing (detect rapid automated requests)
 */
function validateTiming(ip) {
  const key = `timing:${ip}`;
  const now = Date.now();
  const timingData = rateLimitStore.get(key) || { requests: [] };
  
  // Keep only requests from last 10 seconds
  timingData.requests = timingData.requests.filter(
    timestamp => now - timestamp < 10000
  );
  
  // Check for too many requests in short time
  if (timingData.requests.length >= 5) {
    return {
      valid: false,
      reason: 'Too many requests in short time period',
    };
  }
  
  // Add current request
  timingData.requests.push(now);
  rateLimitStore.set(key, timingData);
  
  return { valid: true };
}

/**
 * Main bot protection check
 */
export function checkBotProtection(req) {
  const ip = getClientIP(req);
  
  // Check rate limit
  const rateLimitCheck = checkRateLimit(ip);
  if (!rateLimitCheck.allowed) {
    return {
      blocked: true,
      reason: rateLimitCheck.reason,
      retryAfter: rateLimitCheck.retryAfter,
      ip,
    };
  }
  
  // Validate browser
  const browserCheck = validateBrowser(req);
  if (!browserCheck.valid) {
    return {
      blocked: true,
      reason: browserCheck.reason,
      ip,
    };
  }
  
  // Validate timing
  const timingCheck = validateTiming(ip);
  if (!timingCheck.valid) {
    return {
      blocked: true,
      reason: timingCheck.reason,
      ip,
    };
  }
  
  return {
    blocked: false,
    ip,
  };
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (key.startsWith('ratelimit:') || key.startsWith('timing:')) {
      if (value.resetAt && now >= value.resetAt) {
        keysToDelete.push(key);
      }
    } else if (key.startsWith('blocked:')) {
      if (value.until && now >= value.until) {
        keysToDelete.push(key);
        const ip = key.replace('blocked:', '');
        BLOCKED_IPS.delete(ip);
      }
    }
  }
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

