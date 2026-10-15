// Paid video task polling is intentionally disabled with the video generator.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Allow', 'GET');
  return res.status(410).json({
    ok: false,
    disabled: true,
    error: 'Video generation has been retired. No paid video provider is contacted.'
  });
};
