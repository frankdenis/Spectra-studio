import React,{useState} from 'react'
import {supabase} from '../lib/supabase'

export default function VoiceStudio({mode='tts',user,onBack,onNotify}){
 const [currentUser,setCurrentUser]=useState(user||null)
 const [text,setText]=useState('Hello from Spectra Studio.')
 const [voice,setVoice]=useState('')
 const [audio,setAudio]=useState(null)
 const [file,setFile]=useState(null)
 const [name,setName]=useState('My Spectra Voice')
 const [consent,setConsent]=useState(false)
 const [busy,setBusy]=useState(false)
 React.useEffect(()=>{if(!currentUser&&supabase)supabase.auth.getUser().then(({data})=>setCurrentUser(data.user||null))},[currentUser])
 const synthesize=async()=>{
  if(!supabase||!text.trim())return
  setBusy(true);setAudio(null)
  try{const {data:{session}}=await supabase.auth.getSession();const r=await fetch('/api/playht/tts',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:JSON.stringify({text,voice:voice||undefined,voice_engine:'Play3.0-mini',output_format:'mp3'})});if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Voice generation failed.')}const blob=await r.blob();setAudio(URL.createObjectURL(blob));onNotify?.('Voice generation completed.')}catch(e){onNotify?.(e.message||'Voice generation failed.')}finally{setBusy(false)}}
 const clone=async()=>{
  if(!supabase||!file||!consent)return
  setBusy(true)
  try{const {data:{session}}=await supabase.auth.getSession();const ext=file.name.split('.').pop()?.toLowerCase()||'wav';const path=`${currentUser?.id||'anonymous'}/voice-${crypto.randomUUID()}.${ext}`;const up=await supabase.storage.from('media-assets').upload(path,file,{upsert:false,contentType:file.type});if(up.error)throw up.error;const signed=await supabase.storage.from('identity-assets').createSignedUrl(path,3600);if(signed.error)throw signed.error;const r=await fetch('/api/playht/clone',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:JSON.stringify({voiceName:name,sampleFileUrl:signed.data.signedUrl,consentConfirmed:true})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Voice cloning failed.');onNotify?.('Your voice clone is ready.')}catch(e){onNotify?.(e.message||'Voice cloning failed.')}finally{setBusy(false)}}
 return <section className="voice-studio workspace-panel"><div className="workspace-panel-head"><div><div className="eyebrow"><span className="eyebrow-line"/> VOICE STUDIO</div><h1>{mode==='clone'?'Clone your voice.':'Give words a voice.'}</h1><p>{mode==='clone'?'Upload your own voice or a recording you have explicit permission to clone.':'Generate natural speech through the server-side PlayHT adapter without exposing provider credentials in the browser.'}</p></div><button className="ghost-button" onClick={onBack}>← Back</button></div>
 {mode==='clone'?<div className="studio-workbench"><div><h2>Voice cloning</h2><p>Use a clear audio sample. Consent is recorded before the provider is called.</p><label className="input-label">Voice name<input value={name} onChange={e=>setName(e.target.value)}/></label><input type="file" accept="audio/*" onChange={e=>setFile(e.target.files?.[0]||null)}/><label className="consent-line"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I own this voice or have explicit permission to clone it.</label><button className="primary-button" disabled={!file||!consent||busy} onClick={clone}>{busy?'Cloning securely…':'Create voice clone'} <span>↗</span></button></div><div className="studio-provider-note"><strong>Provider: PlayHT</strong><span>Instant cloning is supported by the provider. Provider account limits still apply; Spectra cannot bypass them.</span></div></div>:<div className="studio-workbench"><div><h2>Text to speech</h2><textarea className="voice-textarea" rows="10" value={text} onChange={e=>setText(e.target.value)} /><label className="input-label">Voice ID (optional)<input value={voice} onChange={e=>setVoice(e.target.value)} placeholder="Use a PlayHT or cloned voice ID"/></label><button className="primary-button" disabled={busy||!text.trim()} onClick={synthesize}>{busy?'Generating…':'Generate speech'} <span>↗</span></button></div><div className="studio-provider-note"><strong>Realtime-ready voice engine</strong><span>PlayHT supports streaming TTS, multilingual voices and cloned voices through its API.</span>{audio&&<audio controls src={audio} className="voice-player"/>}</div></div>}</section>
}
