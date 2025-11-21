/**
 * Streaming Seating API - Returns results as they come in
 * GET /api/seating-stream?ra=<RA>&date=<DATE>
 * 
 * Uses Server-Sent Events (SSE) to stream results incrementally
 */

import { getSeatingInfoStreaming } from './seating-utils.js';
import { checkBotProtection } from './bot-protection.js';

export default async function handler(req, res) {
  // Set CORS headers for SSE
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
    
    // Bot protection check
    const botCheck = checkBotProtection(req, ra);
    if (botCheck.blocked) {
      res.status(429).json({
        status: 'error',
        error: 'Too many requests',
        message: botCheck.reason || 'Too many requests. Please try again later.',
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
    
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial connection message
    res.write('data: ' + JSON.stringify({ type: 'connected', message: 'Streaming started' }) + '\n\n');
    
    // Stream results as they come in
    let streamClosed = false;
    
    await getSeatingInfoStreaming(ra, date || null, (campusResult) => {
      // Send each campus result as it arrives
      if (!streamClosed) {
        try {
          res.write('data: ' + JSON.stringify({
            type: 'campus_result',
            campus: campusResult.campusName,
            matches: campusResult.matches,
            complete: campusResult.complete,
            error: campusResult.error,
          }) + '\n\n');
        } catch (err) {
          console.error('Error writing campus result:', err);
          streamClosed = true;
        }
      }
    }, (finalResult) => {
      // Send final complete result
      if (!streamClosed) {
        try {
          res.write('data: ' + JSON.stringify({
            type: 'complete',
            ...finalResult,
          }) + '\n\n');
        } catch (err) {
          console.error('Error writing final result:', err);
        }
      }
      
      // Close the stream
      if (!streamClosed) {
        res.end();
        streamClosed = true;
      }
    });
    
  } catch (error) {
    console.error('Seating Stream API Error:', error);
    
    // Send error via SSE
    res.write('data: ' + JSON.stringify({
      type: 'error',
      error: 'Internal server error',
      message: error.message,
    }) + '\n\n');
    
    res.end();
  }
}

