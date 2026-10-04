import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  const token=(req.headers.authorization||'').replace(/^Bearer\\s+/,'')
  if(!token) return res.status(401).json({error:'Authentication required'})
  const {data:{user},error:authError}=await supabase.auth.getUser(token)
  if(authError||!user) return res.status(401).json({error:'Invalid session'})
  if(!process.env.PLAY_HT_USER_ID||!process.env.PLAY_HT_API_KEY) return res.status(503).json({error:'PlayHT provider is not configured yet.'})
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{}
  if(!body.text||typeof body.text!=='string') return res.status(400).json({error:'Text is required.'})
  if(body.text.length>20000) return res.status(400).json({error:'Text exceeds the supported request size.'})
  const payload={text:body.text,voice_engine:body.voice_engine||'Play3.0-mini',voice:body.voice||undefined,output_format:body.output_format||'mp3',speed:body.speed||1,quality:body.quality||'high'}
  Object.keys(payload).forEach(k=>payload[k]===undefined&&delete payload[k])
  const upstream=await fetch('https://api.play.ht/api/v2/tts/stream',{method:'POST',headers:{'X-USER-ID':process.env.PLAY_HT_USER_ID,'AUTHORIZATION':process.env.PLAY_HT_API_KEY,'accept':'audio/mpeg','content-type':'application/json'},body:JSON.stringify(payload)})
  if(!upstream.ok){const detail=await upstream.text();return res.status(upstream.status).json({error:'PlayHT request failed.',detail:detail.slice(0,1000)})}
  res.statusCode=200
  res.setHeader('Content-Type',upstream.headers.get('content-type')||'audio/mpeg')
  res.setHeader('Cache-Control','no-store')
  const buffer=Buffer.from(await upstream.arrayBuffer())
  return res.end(buffer)
}
