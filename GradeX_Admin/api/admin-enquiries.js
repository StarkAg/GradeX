const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE_NAME = process.env.SUPABASE_ENQUIRIES_TABLE || 'enquiries';

async function fetchEnquiries(limit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  const endpoint = new URL(`/rest/v1/${TABLE_NAME}`, SUPABASE_URL);
  endpoint.searchParams.set(
    'select',
    'id,register_number,student_name,search_date,searched_at,results_found,result_count,campuses'
  );
  if (limit) {
    endpoint.searchParams.set('limit', String(limit));
  }
  endpoint.searchParams.set('order', 'searched_at.desc');

  const response = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      status: 'error',
      error: 'Method not allowed',
    });
  }

  const limitParam = Number(req.query.limit) || 500;
  const limit = Number.isFinite(limitParam) ? Math.min(limitParam, 1000) : 500;

  try {
    const data = await fetchEnquiries(limit);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('[admin-enquiries]', error);
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Unexpected error',
    });
  }
}


