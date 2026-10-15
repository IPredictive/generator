// Video generation is intentionally disabled to prevent paid provider requests.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Allow', 'POST');
  return res.status(410).json({
    ok: false,
    disabled: true,
    error: 'Video generation has been retired. Use the free AplusCity project brief builder instead.'
  });
};
