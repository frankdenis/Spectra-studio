import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const PLAY_HT_USER_ID = process.env.PLAY_HT_USER_ID || process.env.PLAYHT_USER_ID
const PLAY_HT_API_KEY = process.env.PLAY_HT_API_KEY || process.env.PLAYHT_API_KEY

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  const token=(req.headers.authorization||'').replace(/^Bearer\\s+/,'')
  if(!token) return res.status(401).json({error:'Authentication required'})
  const {data:{user},error:authError}=await supabase.auth.getUser(token)
  if(authError||!user) return res.status(401).json({error:'Invalid session'})
  if(!!PLAY_HT_USER_ID||!PLAY_HT_API_KEY) return res.status(503).json({error:'PlayHT provider is not configured yet.'})
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{}
  if(body.consentConfirmed!==true) return res.status(400).json({error:'Explicit voice-owner consent is required.'})
  if(!body.sampleFileUrl||!/^https:\\/\\//i.test(body.sampleFileUrl)) return res.status(400).json({error:'A secure sample file URL is required.'})
  const voiceName=String(body.voiceName||'My Spectra Voice').trim().slice(0,80)
  const url=new URL('https://api.play.ht/api/v2/cloned-voices/instant/')
  url.searchParams.set('sample_file_url',body.sampleFileUrl)
  url.searchParams.set('voice_name',voiceName)
  const upstream=await fetch(url,{method:'POST',headers:{'X-USER-ID':PLAY_HT_USER_ID,'AUTHORIZATION':PLAY_HT_API_KEY,'accept':'application/json'}})
  const text=await upstream.text()
  if(!upstream.ok)return res.status(upstream.status).json({error:'PlayHT voice cloning failed.',detail:text.slice(0,1000)})
  let data;try{data=JSON.parse(text)}catch{data={raw:text}}
  const providerVoiceId=data.id||data.voiceId||data.voice_id||data.voice
  await supabase.from('voice_models').insert({owner_id:user.id,name:voiceName,provider:'playht',provider_voice_id:providerVoiceId||null,status:'ready',metadata:{provider_response:data}})
  return res.status(200).json({ok:true,voice:data})
}
