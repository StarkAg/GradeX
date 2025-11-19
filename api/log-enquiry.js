/**
 * API endpoint to log user enquiries/searches
 * POST /api/log-enquiry
 * 
 * Logs user search queries for analytics and tracking
 */

import { supabase, isSupabaseConfigured, supabaseAdmin } from './supabase-client.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({
      status: 'error',
      error: 'Method not allowed',
    });
    return;
  }
  
  try {
    if (!isSupabaseConfigured() || !supabase) {
      console.error('[log-enquiry] Supabase not configured');
      res.status(500).json({
        status: 'error',
        error: 'Supabase not configured',
      });
      return;
    }
    
    // Extract data from request body
    const {
      register_number,
      search_date,
      results_found = false,
      result_count = 0,
      campuses = [],
      use_live_api = true,
      error_message = null,
      student_name = null,
    } = req.body;
    
    console.log('[log-enquiry] Received enquiry:', {
      register_number,
      search_date,
      results_found,
      result_count,
      campuses,
      use_live_api,
      student_name,
    });
    
    // Validate required fields
    if (!register_number || typeof register_number !== 'string' || register_number.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        error: 'register_number is required',
      });
      return;
    }
    
    // Get IP address and user agent (optional)
    const ip_address = req.headers['x-forwarded-for'] 
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.headers['x-real-ip'] 
      ? req.headers['x-real-ip']
      : null;
    
    const user_agent = req.headers['user-agent'] || null;
    
    // Get current time and format as IST (Asia/Kolkata timezone)
    // Create date in IST timezone for proper timestamp storage
    const now = new Date();
    // Format: Convert to IST timezone string (UTC+5:30)
    // Use Intl.DateTimeFormat to get IST time
    const istTimeString = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);
    
    // Build ISO string in IST timezone
    const year = istTimeString.find(p => p.type === 'year').value;
    const month = istTimeString.find(p => p.type === 'month').value;
    const day = istTimeString.find(p => p.type === 'day').value;
    const hour = istTimeString.find(p => p.type === 'hour').value;
    const minute = istTimeString.find(p => p.type === 'minute').value;
    const second = istTimeString.find(p => p.type === 'second').value;
    
    // Format as ISO string with IST timezone (+05:30)
    const searchedAtIST = `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
    
    // Use admin client if available (bypasses RLS), otherwise use regular client
    // Admin client is safer and will always work
    const clientToUse = supabaseAdmin || supabase;
    
    if (!clientToUse) {
      res.status(500).json({
        status: 'error',
        error: 'Supabase client not available',
      });
      return;
    }
    
    // Insert into enquiries table with IST timestamp
    const { data, error } = await clientToUse
      .from('enquiries')
      .insert({
        register_number: register_number.trim().toUpperCase(),
        search_date: search_date || null,
        searched_at: searchedAtIST, // Explicit IST timestamp
        results_found: results_found === true,
        result_count: result_count || 0,
        campuses: Array.isArray(campuses) ? campuses : [],
        use_live_api: use_live_api === true,
        error_message: error_message || null,
        student_name: student_name || null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        created_at: searchedAtIST, // Also set created_at to IST
      })
      .select()
      .single();
    
    if (error) {
      console.error('[log-enquiry] Supabase insert error:', error);
      console.error('[log-enquiry] Error details:', JSON.stringify(error, null, 2));
      res.status(500).json({
        status: 'error',
        error: 'Failed to log enquiry',
        message: error.message,
        details: error,
      });
      return;
    }
    
    console.log('[log-enquiry] ✅ Successfully logged enquiry:', data.id);
    
    // Return success
    res.status(200).json({
      status: 'success',
      id: data.id,
      message: 'Enquiry logged successfully',
    });
  } catch (error) {
    console.error('Error in log-enquiry:', error);
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: error.message,
    });
  }
}

