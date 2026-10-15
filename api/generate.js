const API_ROOT = 'https://apihub.agnes-ai.com';
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
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
  if (!process.env.AGNES_API_KEY) return res.status(503).json({ok:false,error:'Agnes AI is not configured yet. Add AGNES_API_KEY in Vercel Project Settings → Environment Variables, then redeploy.'});
  const body = req.body || {};
  const image = String(body.image || '');
  const prompt = String(body.prompt || '').trim().slice(0, 3000);
  const aspect = String(body.aspectRatio || '9:16');
  const duration = String(body.duration || '15 seconds');
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 3_800_000) return res.status(400).json({ok:false,error:'Please upload a valid JPG, PNG or WebP image under 2.5 MB after optimization.'});
  if (!prompt) return res.status(400).json({ok:false,error:'Please describe the video you want to create.'});
  if (!['9:16','16:9','1:1'].includes(aspect)) return res.status(400).json({ok:false,error:'Unsupported aspect ratio.'});
  const dims = aspect === '9:16' ? {width:576,height:1024} : aspect === '16:9' ? {width:1152,height:648} : {width:768,height:768};
  const frames = duration === '15 seconds' ? 361 : 441;
  try {
    const upstream = await fetch(API_ROOT + '/v1/videos', {
      method:'POST',
      headers:{Authorization:'Bearer ' + process.env.AGNES_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:'agnes-video-v2.0',prompt,image,width:dims.width,height:dims.height,num_frames:frames,frame_rate:24,negative_prompt:'distorted product, warped logo, unreadable text, extra objects, flicker, low quality'})
    });
    const data = await upstream.json().catch(()=>({}));
    if (!upstream.ok) {
      const msg = readableError(data) || 'Agnes AI rejected the request (HTTP ' + upstream.status + '). Check API key, account access, quota and image parameters.';
      return res.status(upstream.status === 401 ? 401 : upstream.status === 429 ? 429 : 502).json({ok:false,error:msg.slice(0,350)});
    }
    const requestId = data.video_id || data.id || data.task_id;
    if (!requestId) return res.status(502).json({ok:false,error:'Agnes AI did not return a video task ID.'});
    return res.status(202).json({ok:true,requestId,estimatedSeconds:data.seconds || null});
  } catch(e) {
    return res.status(502).json({ok:false,error:'Could not contact Agnes AI. Please try again.'});
  }
};
