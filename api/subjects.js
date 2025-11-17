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

  if (!isSupabaseConfigured() || !supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  const codesParam = req.query.codes;
  if (!codesParam || codesParam.trim().length === 0) {
    res.status(400).json({ error: 'codes query parameter is required' });
    return;
  }

  const codes = codesParam
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code.length > 0);

  if (codes.length === 0) {
    res.status(400).json({ error: 'No valid subject codes provided' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('code, name')
      .in('code', codes);

    if (error) {
      console.error('[API] subjects fetch error:', error.message);
      res.status(500).json({ error: 'Failed to fetch subjects' });
      return;
    }

    res.status(200).json({
      subjects: data || []
    });
  } catch (err) {
    console.error('[API] subjects unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
}

