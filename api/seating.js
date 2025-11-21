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
      
      // User-friendly error messages that indicate user behavior issue
      let userMessage = 'You are making requests too quickly. Please slow down and try again in a few minutes.';
      if (botCheck.reason?.includes('sequential')) {
        userMessage = 'Automated scraping detected. Please use the website normally instead of automated tools.';
      } else if (botCheck.reason?.includes('Rate limit')) {
        userMessage = 'Too many requests detected. Please wait a few minutes before trying again.';
      } else if (botCheck.reason?.includes('short time')) {
        userMessage = 'You are clicking too fast. Please wait a moment between searches.';
      }
      
      res.status(429).json({
        status: 'error',
        error: 'Too many requests',
        message: userMessage,
        retryAfter: botCheck.retryAfter || 60,
        userError: true, // Flag to indicate this is a user behavior issue
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
    
    // Return response
    res.status(200).json(result);
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

