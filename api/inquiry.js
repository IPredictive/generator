const GAS_URL = 'https://script.google.com/macros/s/AKfycbzfFudIU54_B0EQsf6R22nQiL3v1liBsnCyUe_DT2iA_IKdtWpqZoorhKg4ed12h3-p/exec';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const payload = {
    name: String(body.name || '').trim().slice(0, 120),
    business: String(body.business || '').trim().slice(0, 160),
    email: String(body.email || '').trim().slice(0, 254),
    package: String(body.package || '').trim().slice(0, 120),
    details: String(body.details || '').trim().slice(0, 3000),
    website: String(body.website || '').trim().slice(0, 200)
  };

  if (payload.website) {
    // Quietly accept honeypot submissions without forwarding them.
    return res.status(200).json({ ok: true, referenceCode: null });
  }
  if (!payload.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return res.status(400).json({ ok: false, error: 'Please enter your name and a valid email address.' });
  }

  try {
    const upstream = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await upstream.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (_) {
      throw new Error('The inquiry service returned an unexpected response.');
    }

    if (!upstream.ok || !result || result.ok !== true || !result.referenceCode) {
      return res.status(502).json({
        ok: false,
        error: (result && result.error) || 'The inquiry could not be confirmed. Please try again.'
      });
    }

    return res.status(200).json({
      ok: true,
      referenceCode: result.referenceCode,
      message: 'Your inquiry has been received.'
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'We could not confirm your inquiry. Please try again or email inquiry@aplusachiever.com.'
    });
  }
};
