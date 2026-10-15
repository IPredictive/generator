const GAS_URL = 'https://script.google.com/macros/s/AKfycbzfFudIU54_B0EQsf6R22nQiL3v1liBsnCyUe_DT2iA_IKdtWpqZoorhKg4ed12h3-p/exec';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const code = String((req.query && req.query.code) || '').trim().toUpperCase();
  if (!/^APC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid reference code, for example APC-7K4M-92QX.' });
  }

  try {
    const url = GAS_URL + '?action=status&code=' + encodeURIComponent(code);
    const upstream = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text = await upstream.text();
    let result;
    try { result = JSON.parse(text); } catch (_) {
      return res.status(502).json({ ok: false, error: 'The status service returned an unexpected response.' });
    }
    if (!upstream.ok || !result || result.ok !== true) {
      return res.status(404).json({ ok: false, error: (result && result.error) || 'We could not find that reference code.' });
    }
    return res.status(200).json({
      ok: true,
      referenceCode: result.referenceCode,
      status: result.status,
      submittedDate: result.submittedDate || '',
      package: result.package || ''
    });
  } catch (_) {
    return res.status(502).json({ ok: false, error: 'Status lookup is temporarily unavailable. Please try again later.' });
  }
};
