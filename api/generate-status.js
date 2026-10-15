const API_ROOT = 'https://apihub.agnes-ai.com';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
  if (!process.env.AGNES_API_KEY) return res.status(503).json({ok:false,error:'Agnes AI is not configured yet.'});
  const id = String((req.query && req.query.id) || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(id)) return res.status(400).json({ok:false,error:'Invalid generation task ID.'});
  try {
    const upstream = await fetch(API_ROOT + '/agnesapi?video_id=' + encodeURIComponent(id), {headers:{Authorization:'Bearer ' + process.env.AGNES_API_KEY}});
    const data = await upstream.json().catch(()=>({}));
    if (!upstream.ok) return res.status(502).json({ok:false,error:'Could not check the Agnes AI task status.'});
    const state = String(data.status || '').toLowerCase();
    if (['completed','complete','succeeded','success','done'].includes(state)) {
      const url = data.metadata && data.metadata.url || data.url || data.video_url;
      if (!url || !/^https:\/\//i.test(url)) return res.status(502).json({ok:false,error:'Agnes AI marked the task complete but did not return a video URL.'});
      return res.status(200).json({ok:true,status:'COMPLETED',videoUrl:url,seconds:data.seconds || null,size:data.size || null});
    }
    if (['failed','error','cancelled'].includes(state)) {
      const detail = data.error && (data.error.message || data.error) || 'Video generation failed. Try a clearer image or simpler prompt.';
      return res.status(200).json({ok:true,status:'FAILED',error:String(detail).slice(0,300)});
    }
    return res.status(200).json({ok:true,status:state || 'IN_PROGRESS',progress:Number.isFinite(Number(data.progress)) ? Number(data.progress) : null});
  } catch(e) {
    return res.status(502).json({ok:false,error:'Status check failed. Please try again.'});
  }
};
