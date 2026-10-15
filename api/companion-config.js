// Public browser configuration only. Never expose the Supabase service-role key here.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return res.status(503).json({ error: 'Account service setup is pending. A dedicated Companion database must be connected in Vercel before accounts and cross-device memory can be enabled.' });
  return res.status(200).json({ url, anonKey });
};