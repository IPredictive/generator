const API_ROOT = 'https://apihub.agnes-ai.com';
const VIDEO_MODEL = 'agnes-video-2.5-flash';

function readableError(value) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    for (const key of ['message', 'detail', 'error_description', 'error', 'msg', 'code']) {
      const nested = value[key];
      if (typeof nested === 'string' && nested.trim()) return nested.trim();
      if (nested && typeof nested === 'object') {
        const inner = readableError(nested);
        if (inner) return inner;
      }
    }
    try { return JSON.stringify(value); } catch (_) {}
  }
  return '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  if (!process.env.AGNES_API_KEY) {
    return res.status(503).json({ok:false,error:'Agnes AI is not configured yet. Add AGNES_API_KEY in Vercel Project Settings → Environment Variables, then redeploy.'});
  }

  const body = req.body || {};
  const image = String(body.image || '');
  const prompt = String(body.prompt || '').trim().slice(0, 3000);
  const aspect = String(body.aspectRatio || '9:16');
  const durationInput = String(body.duration || '8 seconds');
  const durationMatch = durationInput.match(/^(5|8|12)(?: seconds)?$/);
  const seconds = durationMatch ? durationMatch[1] : '8';

  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 3_800_000) {
    return res.status(400).json({ok:false,error:'Please upload a valid JPG, PNG or WebP image under 2.5 MB after optimization.'});
  }
  if (!prompt) return res.status(400).json({ok:false,error:'Please describe the video you want to create.'});
  if (!['9:16','16:9','1:1'].includes(aspect)) {
    return res.status(400).json({ok:false,error:'Unsupported aspect ratio.'});
  }

  try {
    const upstream = await fetch(API_ROOT + '/v1/videos', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.AGNES_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: VIDEO_MODEL,
        prompt,
        mode: 'keyframe',
        first_frame: image,
        seconds,
        size: '720P',
        aspect_ratio: aspect,
        n: 1,
        negative_prompt: 'distorted product, warped logo, unreadable text, extra objects, flicker, low quality'
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const msg = readableError(data) || 'Agnes AI rejected the request (HTTP ' + upstream.status + '). Check API key, model access, quota and request parameters.';
      return res.status(upstream.status === 401 ? 401 : upstream.status === 429 ? 429 : 502)
        .json({ok:false,error:msg.slice(0,350)});
    }

    const requestId = data.video_id || data.id || data.task_id;
    if (!requestId) return res.status(502).json({ok:false,error:'Agnes AI did not return a video task ID.'});
    return res.status(202).json({ok:true,requestId,estimatedSeconds:Number(seconds)});
  } catch (_) {
    return res.status(502).json({ok:false,error:'Could not contact Agnes AI. Please try again.'});
  }
};
