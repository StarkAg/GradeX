/**
 * Example: Vercel-style async handler used with Express (handleVercelRoute).
 * Receives (req, res), returns JSON via res.status().json(...).
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query || {};
  if (action === 'ping') {
    return res.status(200).json({ pong: true, t: Date.now() });
  }

  return res.status(400).json({ error: 'Missing or invalid action' });
}
