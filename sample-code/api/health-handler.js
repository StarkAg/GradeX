/**
 * Example API handler pattern: health check endpoint.
 * Returns 200 + JSON; used by load balancers and deploy checks.
 */
export default async function healthHandler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.status(200).json({
    ok: true,
    service: 'gradex-api',
    timestamp: new Date().toISOString(),
  });
}
