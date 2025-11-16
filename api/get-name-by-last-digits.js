/**
 * API endpoint to get student name by last digits of RA
 * GET /api/get-name-by-last-digits?lastDigits=0014
 */

import { supabase, isSupabaseConfigured } from './supabase-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { lastDigits, fullRA } = req.query;
    
    if (!lastDigits || typeof lastDigits !== 'string' || lastDigits.length === 0) {
      res.status(400).json({ error: 'lastDigits parameter is required' });
      return;
    }
    
    if (!isSupabaseConfigured() || !supabase) {
      res.status(500).json({ error: 'Supabase not configured' });
      return;
    }
    
    // Search for RA numbers ending with these digits
    // Try both case-sensitive and case-insensitive search
    const { data, error } = await supabase
      .from('students')
      .select('register_number, name')
      .ilike('register_number', `%${lastDigits}`)
      .limit(20);
    
    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: error.message });
      return;
    }
    
    if (!data || data.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No student found with these last digits'
      });
      return;
    }
    
    // If fullRA is provided, find exact match first
    if (fullRA) {
      const fullRAMatch = data.find(record => 
        record.register_number && 
        record.register_number.toUpperCase() === fullRA.toUpperCase()
      );
      if (fullRAMatch) {
        res.status(200).json({
          success: true,
          registerNumber: fullRAMatch.register_number,
          name: fullRAMatch.name
        });
        return;
      }
    }
    
    // Find exact match (RA ending with lastDigits, case-insensitive)
    const exactMatch = data.find(record => 
      record.register_number && 
      record.register_number.toUpperCase().endsWith(lastDigits.toUpperCase())
    );
    
    if (exactMatch) {
      res.status(200).json({
        success: true,
        registerNumber: exactMatch.register_number,
        name: exactMatch.name
      });
    } else {
      // Return all matches for frontend to filter by full RA
      res.status(200).json({
        success: true,
        matches: data.map(r => ({
          registerNumber: r.register_number,
          name: r.name
        })),
        note: data.length === 1 ? 'Single match found' : 'Multiple matches found'
      });
    }
  } catch (error) {
    console.error('Error in get-name-by-last-digits:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

