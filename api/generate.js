const MODEL = 'fal-ai/wan/v2.2-5b/image-to-video';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
  if (!process.env.FAL_KEY) return res.status(503).json({ok:false,error:'Video generation is not configured yet. Add FAL_KEY in Vercel Project Settings → Environment Variables, then redeploy.'});
  const body=req.body||{};
  const image=String(body.image||'');
  const prompt=String(body.prompt||'').trim().slice(0,3000);
  const aspect=String(body.aspectRatio||'9:16');
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length>3_800_000) return res.status(400).json({ok:false,error:'Please upload a valid JPG, PNG or WebP image under 2.5 MB after optimization.'});
  if (!prompt) return res.status(400).json({ok:false,error:'Please describe the video you want to create.'});
  if (!['9:16','16:9','1:1'].includes(aspect)) return res.status(400).json({ok:false,error:'Unsupported aspect ratio.'});
  try {
    const upstream=await fetch('https://queue.fal.run/'+MODEL,{
      method:'POST',
      headers:{Authorization:'Key '+process.env.FAL_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({input:{image_url:image,prompt,aspect_ratio:aspect,resolution:'720p',num_frames:81,frames_per_second:24,enable_safety_checker:true,enable_output_safety_checker:true}})
    });
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok || !data.request_id) {
      const msg=String((data&&data.detail)|| (data&&data.message)||'Video provider rejected the request.');
      return res.status(502).json({ok:false,error:msg.slice(0,350)});
    }
    return res.status(202).json({ok:true,requestId:data.request_id,statusUrl:data.status_url||null});
  } catch(e) { return res.status(502).json({ok:false,error:'Could not contact the video service. Please try again.'}); }
};