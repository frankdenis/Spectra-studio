import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const config = {
  image: { title:'Image Studio', eyebrow:'IMAGE', description:'Create production images from text prompts and reference assets.', fields:['Prompt','Aspect ratio','Quality'] },
  video: { title:'Video Studio', eyebrow:'VIDEO', description:'Prepare AI video generations with scenes, motion, camera and audio direction.', fields:['Prompt','Duration','Aspect ratio'] },
  image_to_video: { title:'Image → Video', eyebrow:'MOTION', description:'Turn a still image into a directed video sequence.', fields:['Source image URL','Motion prompt','Duration'] },
  avatar: { title:'AI Avatar', eyebrow:'AVATAR', description:'Create and manage photorealistic AI identities from authorized source media.', fields:['Identity name','Reference image URL','Voice model'] },
  character: { title:'AI Characters', eyebrow:'CHARACTERS', description:'Create reusable AI characters with identity, personality, voice and visual direction.', fields:['Character name','Personality','Voice model','Avatar identity'] },
  avatar_library: { title:'My Avatars', eyebrow:'IDENTITIES', description:'Manage your authorized AI identities.', fields:[] },
  voice_library: { title:'My Voices', eyebrow:'VOICES', description:'Manage stock and custom voice models.', fields:[] },
  character_library: { title:'Characters', eyebrow:'CHARACTERS', description:'Manage reusable AI characters.', fields:[] },
  audio: { title:'Audio Call', eyebrow:'AUDIO CALL', description:'Start a private realtime audio session with recording and transcription support.', fields:['Room name','Participant limit'] },
  video_call: { title:'Video Call', eyebrow:'VIDEO CALL', description:'Start a realtime video room with camera, microphone and screen sharing.', fields:['Room name','Participant limit'] },
  ai_call: { title:'AI Call', eyebrow:'AI CALL', description:'Open a realtime conversation with an AI identity and selected voice.', fields:['Room name','AI identity','Voice'] },
  recordings: { title:'Recordings', eyebrow:'RECORDINGS', description:'Review recorded calls, generated media and transcript-ready sessions.', fields:[] },
  projects: { title:'Projects', eyebrow:'PROJECTS', description:'Organize every creation and communication workflow.', fields:[] },
  library: { title:'Media Library', eyebrow:'LIBRARY', description:'Browse images, video, audio, recordings and identity assets.', fields:[] },
}

export default function StudioModule({ type, user, onBack, onNotify }) {
  const c = config[type] || config.image
  const [values,setValues]=useState({})
  const [busy,setBusy]=useState(false)
  const [items,setItems]=useState([])
  const [tab,setTab]=useState('create')
  const [preview,setPreview]=useState(null)

  useEffect(()=>{ load() },[type])
  const load=async()=>{
    if(!supabase||!user)return
    if(type==='projects'){
      const {data,error}=await supabase.from('projects').select('*').order('updated_at',{ascending:false}).limit(50)
      if(error) onNotify?.(error.message); else setItems(data||[])
    } else if(type==='library'||type==='recordings'){
      const {data,error}=await supabase.from('media_assets').select('*').order('created_at',{ascending:false}).limit(50)
      if(error) onNotify?.(error.message); else setItems(data||[])
    } else if(['audio','video_call','ai_call'].includes(type)){
      const {data,error}=await supabase.from('call_sessions').select('*').order('created_at',{ascending:false}).limit(30)
      if(error) onNotify?.(error.message); else setItems(data||[])
    } else if(type==='avatar'||type==='character'||type==='avatar_library'||type==='character_library'||type==='voice_library'){
      const table=type==='voice_library'?'voice_models':type.includes('character')?'ai_identities':'ai_identities'
      const {data,error}=await supabase.from(table).select('*').order('updated_at',{ascending:false}).limit(30)
      if(error) onNotify?.(error.message); else setItems(data||[])
    }
  }

  const setField=(label,value)=>setValues(v=>({...v,[label]:value}))
  const submit=async()=>{
    if(!supabase||!user)return
    setBusy(true)
    try{
      if(['audio','video_call','ai_call'].includes(type)){
        const {data,error}=await supabase.from('call_sessions').insert({owner_id:user.id,name:values['Room name']||c.title,kind:type==='audio'?'audio':type==='video_call'?'video':'ai',status:'draft',metadata:values}).select().single()
        if(error)throw error
        setItems(x=>[data,...x]); onNotify?.('Call session created. Realtime provider can now join this session.')
      } else if(type==='avatar'||type==='character'){
        const {data,error}=await supabase.from('ai_identities').insert({owner_id:user.id,name:values['Identity name']||values['Character name']||'New identity',status:'draft',metadata:{...values,kind:type}}).select().single()
        if(error)throw error
        setItems(x=>[data,...x]); onNotify?.('AI identity created. Add authorized media and connect the avatar provider.')
      } else if(['image','video','image_to_video'].includes(type)){
        const {data,error}=await supabase.from('generations').insert({owner_id:user.id,kind:type,status:'queued',prompt:values['Prompt']||values['Motion prompt']||'',metadata:values}).select().single()
        if(error)throw error
        setItems(x=>[data,...x])
        try{
          const {data:fn,error:fnError}=await supabase.functions.invoke('generate-media',{body:{generationId:data.id,type,inputs:values}})
          if(fnError)throw fnError
          if(fn?.url)setPreview(fn.url)
          onNotify?.('Generation submitted to the configured provider.')
        }catch(providerError){
          await supabase.from('generations').update({status:'blocked',error_message:'No production generation provider is configured.'}).eq('id',data.id)
          onNotify?.('Generation record created, but no production media provider is configured yet. No fake output was created.')
        }
      } else {
        await load()
      }
    }catch(e){onNotify?.(e.message||'Could not complete the request.')}finally{setBusy(false)}
  }

  const isList=['projects','library','recordings'].includes(type)
  return <section className="studio-module-view">
    <div className="workspace-panel-head">
      <div><div className="eyebrow"><span className="eyebrow-line" /> {c.eyebrow}</div><h1>{c.title}</h1><p>{c.description}</p></div>
      <button className="ghost-button" type="button" onClick={onBack}>← Back</button>
    </div>
    <div className="module-toolbar">
      <button className={tab==='create'?'is-active':''} onClick={()=>setTab('create')}>{isList?'Overview':'Configure'}</button>
      <button className={tab==='history'?'is-active':''} onClick={()=>setTab('history')}>History</button>
    </div>
    {tab==='create' && !isList && <div className="module-editor">
      <div className="module-editor-main">
        {c.fields.map((field,i)=><label key={field}>{field}
          {field.toLowerCase().includes('prompt')||field.toLowerCase().includes('url')?<textarea value={values[field]||''} onChange={e=>setField(field,e.target.value)} placeholder={field.toLowerCase().includes('prompt')?'Describe exactly what you want…':'https://…'} />:<input value={values[field]||''} onChange={e=>setField(field,e.target.value)} placeholder={field.includes('Duration')?'10 seconds':field.includes('Quality')?'High':'Enter a value'} />}
        </label>)}
        <div className="provider-status"><span className="status-pulse"/><div><strong>Production provider boundary</strong><small>Credentials remain server-side. Spectra never fabricates media when a provider is unavailable.</small></div></div>
        <button className="primary-button" disabled={busy} onClick={submit}>{busy?'Submitting…':type.includes('Call')||['audio','video_call','ai_call'].includes(type)?'Create session':'Create production job'} <span>↗</span></button>
      </div>
      <aside className="module-editor-side"><span>WORKFLOW</span><strong>1. Configure</strong><small>2. Submit</small><small>3. Provider processes</small><small>4. Result enters your library</small><div className="module-note">No mock media, fake balances, or simulated provider responses.</div></aside>
    </div>}
    {tab==='create' && isList && <div className="module-list"><div className="card-heading"><h3>{type==='projects'?'All projects':type==='recordings'?'Recordings':'Media assets'}</h3><button className="ghost-button" onClick={load}>Refresh ↻</button></div>{items.length===0?<div className="studio-empty">Nothing here yet.</div>:items.map(item=><button className="module-list-row" key={item.id} onClick={()=>setPreview(item)}><span>{item.kind||item.type||'asset'}</span><strong>{item.name||item.prompt||item.title||'Untitled'}</strong><small>{item.status||'ready'}</small><em>↗</em></button>)}</div>}
    {tab==='history' && <div className="module-list"><div className="card-heading"><h3>Recent activity</h3><button className="ghost-button" onClick={load}>Refresh ↻</button></div>{items.length===0?<div className="studio-empty">No history yet.</div>:items.map(item=><div className="module-list-row" key={item.id}><span>{item.kind||item.type||'asset'}</span><strong>{item.name||item.prompt||item.title||'Untitled'}</strong><small>{item.status||'ready'}</small><time>{item.created_at?new Date(item.created_at).toLocaleString():''}</time></div>)}</div>}
    {preview && <div className="module-preview"><button onClick={()=>setPreview(null)}>×</button><pre>{JSON.stringify(preview,null,2)}</pre></div>}
  </section>
}
