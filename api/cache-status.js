/**
 * Cache Status API - View cache statistics in real-time
 * GET /api/cache-status
 * 
 * Shows current cache state, size, age, and statistics
 */

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
    const { getCacheStatus } = await import('./seating-utils.js');
    const status = await getCacheStatus();
    
    res.status(200).json({
      status: 'success',
      ...status,
    });
  } catch (error) {
    console.error('Cache Status API Error:', error);
    
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: error.message,
    });
  }
}

