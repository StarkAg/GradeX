/**
 * Vercel Serverless Function: Seating Arrangement API
 * GET /api/seating?ra=<RA>&date=<DATE>
 * 
 * Vercel automatically detects files in /api directory as serverless functions
 */

import { getSeatingInfo } from './seating-utils.js';
import { checkBotProtection } from './bot-protection.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    res.status(405).json({
      status: 'error',
      error: 'Method not allowed',
    });
    return;
  }
  
  try {
    // Extract query parameters
    const { ra, date } = req.query;
    
    // Bot protection check (with RA for pattern detection)
    const botCheck = checkBotProtection(req, ra);
    if (botCheck.blocked) {
      console.warn(`[Bot Protection] Blocked request from IP: ${botCheck.ip}, RA: ${ra}, Reason: ${botCheck.reason}`);
      res.status(429).json({
        status: 'error',
        error: 'Request blocked',
        message: botCheck.reason || 'Too many requests. Please try again later.',
        retryAfter: botCheck.retryAfter || 60,
      });
      return;
    }
    
    // Validate RA
    if (!ra || typeof ra !== 'string' || ra.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        error: 'RA number is required',
      });
      return;
    }
    
    // Fetch seating information
    const result = await getSeatingInfo(ra, date || null);
    
    // Temporary: Add debug info
    // TODO: Remove debug info after fixing
    const debugInfo = {
      queryRA: ra,
      queryDate: date || null,
      totalMatches: Object.values(result.results || {}).reduce((sum, arr) => sum + arr.length, 0),
      campusResults: Object.entries(result.results || {}).map(([campus, matches]) => ({
        campus,
        matchCount: matches.length,
      })),
    };
    
    // Return response
    res.status(200).json({
      ...result,
      _debug: debugInfo, // Temporary debug field
    });
  } catch (error) {
    console.error('Seating API Error:', error);
    
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: error.message,
      lastUpdated: new Date().toISOString(),
    });
  }
}

