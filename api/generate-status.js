const MODEL = 'fal-ai/wan/v2.2-5b/image-to-video';
module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!process.env.FAL_KEY)return res.status(503).json({ok:false,error:'Video generation is not configured yet.'});
  const id=String((req.query&&req.query.id)||'').trim();
  if(!/^[a-f0-9-]{20,60}$/i.test(id))return res.status(400).json({ok:false,error:'Invalid generation task ID.'});
  const headers={Authorization:'Key '+process.env.FAL_KEY};
  try{
    const root='https://queue.fal.run/'+MODEL+'/requests/'+encodeURIComponent(id);
    const sr=await fetch(root+'/status',{headers});
    const st=await sr.json().catch(()=>({}));
    if(!sr.ok)return res.status(502).json({ok:false,error:'Could not check the video task status.'});
    if(st.status==='COMPLETED'){
      const rr=await fetch(root,{headers});
      const result=await rr.json().catch(()=>({}));
      const url=result&&result.video&&result.video.url;
      if(!rr.ok||!url||!/^https:\/\//i.test(url))return res.status(502).json({ok:false,error:'The task completed, but no video URL was returned.'});
      return res.status(200).json({ok:true,status:'COMPLETED',videoUrl:url});
    }
    if(st.status==='FAILED'||st.status==='CANCELLED')return res.status(200).json({ok:true,status:st.status,error:'Video generation failed. Try a clearer product image or a simpler prompt.'});
    return res.status(200).json({ok:true,status:st.status||'IN_QUEUE'});
  }catch(e){return res.status(502).json({ok:false,error:'Status check failed. Please try again.'});}
};