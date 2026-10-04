import React,{useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'

export default function AdminDashboard({user,onClose,onSignOut}){
 const [stats,setStats]=useState({users:0,projects:0,generations:0,calls:0,voices:0,identities:0,errors:0})
 const [loading,setLoading]=useState(true)
 useEffect(()=>{if(!supabase)return;Promise.all([
  supabase.from('profiles').select('*',{count:'exact',head:true}),
  supabase.from('projects').select('*',{count:'exact',head:true}),
  supabase.from('generations').select('*',{count:'exact',head:true}),
  supabase.from('call_sessions').select('*',{count:'exact',head:true}),
  supabase.from('voice_models').select('*',{count:'exact',head:true}),
  supabase.from('ai_identities').select('*',{count:'exact',head:true}),
  supabase.from('generations').select('*',{count:'exact',head:true}).eq('status','failed')
 ]).then(results=>setStats({users:results[0].count||0,projects:results[1].count||0,generations:results[2].count||0,calls:results[3].count||0,voices:results[4].count||0,identities:results[5].count||0,errors:results[6].count||0})).finally(()=>setLoading(false))},[])
 return <main className="admin-screen"><header className="admin-header"><div><span className="auth-kicker">SPECTRA CONTROL PLANE</span><h1>Administrator dashboard</h1><p>Platform-wide operations, providers, users, media and usage.</p></div><div className="admin-actions"><span className="admin-badge">UNLIMITED ACCESS</span><button className="ghost-button" onClick={onClose}>Return to Studio</button><button className="ghost-button" onClick={onSignOut}>Sign out</button></div></header>
 <section className="admin-grid"><article><span>USERS</span><strong>{loading?'—':stats.users}</strong><p>Registered accounts and access status.</p></article><article><span>PROJECTS</span><strong>{loading?'—':stats.projects}</strong><p>Creation projects across the platform.</p></article><article><span>GENERATIONS</span><strong>{loading?'—':stats.generations}</strong><p>Images, video, voice and AI jobs.</p></article><article><span>CALLS</span><strong>{loading?'—':stats.calls}</strong><p>Audio, video and AI call sessions.</p></article><article><span>VOICES</span><strong>{loading?'—':stats.voices}</strong><p>Provider voices and custom clones.</p></article><article><span>IDENTITIES</span><strong>{loading?'—':stats.identities}</strong><p>AI faces and realtime identities.</p></article><article><span>FAILED JOBS</span><strong>{loading?'—':stats.errors}</strong><p>Generation jobs requiring investigation.</p></article><article><span>PROVIDERS</span><strong>Control</strong><p>PlayHT, avatar, image, video, LLM and realtime adapters.</p></article></section>
 <section className="admin-grid admin-grid--wide"><article><span>USER CONTROL</span><strong>Accounts, roles & plans</strong><p>Manage access, subscriptions, limits and suspension policies from the secured server-side control plane.</p></article><article><span>AI CONTROL</span><strong>Models & provider routing</strong><p>Choose primary/fallback providers, enable experimental models and control generation availability.</p></article><article><span>SECURITY</span><strong>Audit trail</strong><p>Authentication events, provider calls and administrative actions are stored for review.</p></article><article><span>PLATFORM</span><strong>Feature flags</strong><p>Maintenance mode, realtime features, generation modules and rollout controls.</p></article></section>
 <div className="admin-footer"><span>Signed in as {user?.email}</span><strong>Administrative controls are designed to be enforced by Supabase RLS and server-side provider routes.</strong></div></main>
}
