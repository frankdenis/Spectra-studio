import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import VoiceStudio from './VoiceStudio'

const sections = {
  'Create': [
    ['Image Studio','image','Generate and edit images from prompts and reference assets.'],
    ['Video Studio','video','Create AI videos with characters, voice and scene direction.'],
    ['Image → Video','image_to_video','Animate an image into a directed video sequence.'],
    ['Voice Studio','voice','Generate natural speech and manage voices.'],
    ['Voice Cloner','voice_clone','Create a voice model from audio you own or have permission to use.'],
    ['AI Avatar','avatar','Build a photorealistic AI identity from source media.'],
  ],
  'Communicate': [
    ['Audio Calls','audio','Private realtime audio rooms with recording and transcription.'],
    ['Video Calls','video_call','Realtime video rooms with camera, screen share and AI participants.'],
    ['AI Calls','ai_call','Talk to your AI identity with voice and video.'],
    ['Recordings','recordings','Review calls, recordings and transcripts.'],
  ],
  'Library': [
    ['Projects','projects','All your creation projects in one place.'],
    ['Media Library','library','Images, video, audio, voices and identity assets.'],
  ],
}

export default function StudioHub({ section = 'Create', user, onBack, onNotify }) {
  const [active, setActive] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('Untitled project')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!supabase) return
    supabase.from('projects').select('id,name,type,status,created_at,updated_at').order('updated_at',{ascending:false}).limit(20)
      .then(({data,error}) => {
        if (!cancelled) {
          if (error) onNotify?.(error.message)
          setProjects(data || [])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [onNotify])

  const open = (item) => {
    setActive(item)
    setName(item[0])
  }

  const createProject = async () => {
    if (!supabase || !active) return
    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in is required.')
      const { data, error } = await supabase.from('projects').insert({
        owner_id:user.id, name:name.trim() || active[0], type:active[1], status:'draft',
        metadata:{source:'spectra-studio'}
      }).select('id,name,type,status,created_at,updated_at').single()
      if (error) throw error
      setProjects(current => [data,...current])
      onNotify?.(`${data.name} created. The next step is to connect the selected AI provider.`)
    } catch(e) { onNotify?.(e.message || 'Could not create project.') }
    finally { setBusy(false) }
  }

  if(active && (active[1]==='voice'||active[1]==='voice_clone')) return <VoiceStudio mode={active[1]==='voice_clone'?'clone':'tts'} user={user} onBack={()=>setActive(null)} onNotify={onNotify} />

  const title = section === 'Create' ? 'Create anything with Spectra.' : section === 'Communicate' ? 'Talk, meet and create together.' : 'Everything you create, organized.'

  return <section className="studio-hub">
    <div className="workspace-panel-head">
      <div><div className="eyebrow"><span className="eyebrow-line" /> {section.toUpperCase()}</div><h1>{title}</h1><p>Production-ready workspace modules backed by your Spectra account and Supabase.</p></div>
      <button className="ghost-button" type="button" onClick={onBack}>← Back to dashboard</button>
    </div>
    <div className="studio-module-grid">
      {(sections[section] || sections.Create).map(item => <button className={`studio-module ${active?.[0]===item[0]?'is-active':''}`} key={item[0]} type="button" onClick={()=>open(item)}>
        <span className="studio-module-icon">{item[0].includes('Voice')?'◖':item[0].includes('Video')||item[1]==='video_call'?'▣':item[0].includes('Image')?'◇':item[0].includes('Calls')?'◉':'✦'}</span>
        <strong>{item[0]}</strong><span>{item[2]}</span><em>Open ↗</em>
      </button>)}
    </div>
    {active && <div className="studio-workbench">
      <div><span className="eyebrow"><span className="eyebrow-line" /> {active[1].replaceAll('_',' ').toUpperCase()}</span><h2>{active[0]}</h2><p>{active[2]}</p></div>
      <div className="studio-form">
        <label>Project name<input value={name} onChange={e=>setName(e.target.value)} /></label>
        <div className="studio-provider-note"><strong>Provider connection</strong><span>{active[1]==='voice'||active[1]==='voice_clone' ? 'PlayHT-ready voice adapter. Provider credentials are kept server-side.' : 'Provider adapter slot ready. No fake generation is shown when a provider is not configured.'}</span></div>
        <button className="primary-button" disabled={busy} type="button" onClick={createProject}>{busy?'Creating…':'Create project'} <span>↗</span></button>
      </div>
    </div>}
    <div className="studio-projects">
      <div className="card-heading"><div><div className="section-kicker"><span className="section-index">01</span><span>Projects</span></div><h3>Recent work</h3></div></div>
      {loading ? <div className="studio-empty">Loading your projects…</div> : projects.length===0 ? <div className="studio-empty">No projects yet. Choose a module above to create the first one.</div> : <div className="studio-project-list">{projects.map(p=><div className="studio-project-row" key={p.id}><span className="studio-project-type">{p.type.replaceAll('_',' ')}</span><strong>{p.name}</strong><span>{p.status}</span><small>{new Date(p.updated_at).toLocaleString()}</small></div>)}</div>}
    </div>
  </section>
}
