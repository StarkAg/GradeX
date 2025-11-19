/**
 * API endpoint to fetch enquiries (admin only)
 * GET /api/admin-enquiries
 * 
 * Returns enquiries data for admin dashboard
 * Uses service role key to bypass RLS
 */

import { supabaseAdmin, isSupabaseConfigured, supabase } from './supabase-client.js';

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
    // Use admin client to bypass RLS
    const clientToUse = supabaseAdmin || supabase;
    
    if (!clientToUse) {
      res.status(500).json({
        status: 'error',
        error: 'Supabase not configured',
      });
      return;
    }
    
    const limit = parseInt(req.query.limit) || 500;
    
    // Fetch enquiries
    const { data, error } = await clientToUse
      .from('enquiries')
      .select('*')
      .order('searched_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[admin-enquiries] Error:', error);
      res.status(500).json({
        status: 'error',
        error: 'Failed to fetch enquiries',
        message: error.message,
      });
      return;
    }
    
    // Return data
    res.status(200).json({
      status: 'success',
      count: data.length,
      data: data || [],
    });
  } catch (error) {
    console.error('Error in admin-enquiries:', error);
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: error.message,
    });
  }
}

