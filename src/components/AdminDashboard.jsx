import React,{useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'

const tabs=['Overview','Users','Plans','Generations','Calls','Voices','Identities','Audit']

export default function AdminDashboard({user,onClose,onSignOut}){
 const [tab,setTab]=useState('Overview')
 const [loading,setLoading]=useState(true)
 const [rows,setRows]=useState([])
 const [stats,setStats]=useState({})
 const [notice,setNotice]=useState('')

 const load=async()=>{
  if(!supabase||!user)return
  setLoading(true)
  try{
   const [users,projects,generations,calls,voices,identities,failed]=await Promise.all([
    supabase.from('profiles').select('id,full_name,role,status,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('projects').select('id',{count:'exact',head:true}),
    supabase.from('generations').select('id,status,kind,prompt,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('call_sessions').select('id,kind,status,duration_seconds,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('voice_models').select('id,name,provider,status,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('ai_identities').select('id,name,provider,status,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('generations').select('id',{count:'exact',head:true}).eq('status','failed')
   ])
   const errors=[users,projects,generations,calls,voices,identities,failed].find(x=>x.error)
   if(errors?.error)throw errors.error
   setRows(tab==='Users'?users.data||[]:tab==='Generations'?generations.data||[]:tab==='Calls'?calls.data||[]:tab==='Voices'?voices.data||[]:tab==='Identities'?identities.data||[]:[])
   setStats({users:users.data?.length||0,projects:projects.count||0,generations:generations.data?.length||0,calls:calls.data?.length||0,voices:voices.data?.length||0,identities:identities.data?.length||0,failed:failed.count||0})
  }catch(e){setNotice(e.message||'Admin data could not be loaded.')}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[tab])

 const setStatus=async(id,status)=>{
  const {error}=await supabase.from('profiles').update({status,updated_at:new Date().toISOString()}).eq('id',id)
  if(error)setNotice(error.message);else{setNotice('User access updated.');load()}
 }
 const setRole=async(id,role)=>{
  const {error}=await supabase.from('profiles').update({role,updated_at:new Date().toISOString()}).eq('id',id)
  if(error)setNotice(error.message);else{setNotice('User role updated.');load()}
 }

 return <main className="admin-screen">
  <header className="admin-header"><div><span className="auth-kicker">SPECTRA CONTROL PLANE</span><h1>Administrator dashboard</h1><p>Live platform data and administrative controls. Provider secrets remain server-side.</p></div><div className="admin-actions"><span className="admin-badge">ADMIN CONTROL</span><button className="ghost-button" onClick={onClose}>Return to Studio</button><button className="ghost-button" onClick={onSignOut}>Sign out</button></div></header>
  <nav className="admin-tabs">{tabs.map(x=><button key={x} className={tab===x?'is-active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav>
  {notice&&<div className="auth-message">{notice}</div>}
  {tab==='Overview'?<><section className="admin-grid">{[['USERS',stats.users],['PROJECTS',stats.projects],['GENERATIONS',stats.generations],['CALLS',stats.calls],['VOICES',stats.voices],['IDENTITIES',stats.identities],['FAILED JOBS',stats.failed]].map(([label,value])=><article key={label}><span>{label}</span><strong>{loading?'—':value}</strong><p>Live database count.</p></article>)}</section><section className="admin-grid admin-grid--wide"><article><span>SECURITY</span><strong>RLS enforced</strong><p>Administrative access is controlled by the authenticated Supabase profile role.</p></article><article><span>PROVIDERS</span><strong>Server-side only</strong><p>PlayHT, Tavus and media provider credentials are never shipped to the browser.</p></article><article><span>USAGE</span><strong>Entitlements</strong><p>Per-user limits are stored in Supabase and checked by protected provider routes.</p></article></section></>:
  tab==='Users'?<section className="admin-table">{loading?<div className="studio-empty">Loading users…</div>:rows.map(r=><div className="admin-row" key={r.id}><div><strong>{r.full_name||'Unnamed user'}</strong><small>{r.id}</small></div><select value={r.role} onChange={e=>setRole(r.id,e.target.value)}><option value="user">user</option><option value="admin">admin</option></select><select value={r.status} onChange={e=>setStatus(r.id,e.target.value)}><option value="active">active</option><option value="suspended">suspended</option><option value="deleted">deleted</option></select></div>)}</section>:
  tab==='Plans'?<PlanManager onNotify={setNotice}/>:<section className="admin-table">{loading?<div className="studio-empty">Loading…</div>:!rows.length?<div className="studio-empty">No records yet.</div>:rows.map(r=><div className="admin-row" key={r.id}><div><strong>{r.name||r.prompt||r.kind||r.id}</strong><small>{r.provider||r.status||''}</small></div><span>{r.status||r.duration_seconds||''}</span><small>{r.created_at?new Date(r.created_at).toLocaleString():''}</small></div>)}</section>}
  <div className="admin-footer"><span>Signed in as {user?.email}</span><strong>Administrative actions are audited by the platform backend when implemented through protected routes.</strong></div>
 </main>
}

function PlanManager({onNotify}){
 const [plans,setPlans]=useState([]),[busy,setBusy]=useState(false)
 const load=async()=>{const {data,error}=await supabase.from('subscription_plans').select('*').order('monthly_price_ngn');if(error)onNotify(error.message);else setPlans(data||[])}
 useEffect(()=>{load()},[])
 const save=async(p)=>{setBusy(true);const {error}=await supabase.from('subscription_plans').update({monthly_price_ngn:Number(p.monthly_price_ngn||0),monthly_price_usd:p.monthly_price_usd===null?null:Number(p.monthly_price_usd||0),active:Boolean(p.active)}).eq('id',p.id);if(error)onNotify(error.message);else onNotify('Plan updated.');setBusy(false)}
 return <section className="admin-table">{plans.map(p=><div className="admin-row" key={p.id}><div><strong>{p.name}</strong><small>{p.id}</small></div><label>₦<input value={p.monthly_price_ngn} onChange={e=>setPlans(xs=>xs.map(x=>x.id===p.id?{...x,monthly_price_ngn:e.target.value}:x))}/></label><label><input type="checkbox" checked={p.active} onChange={e=>setPlans(xs=>xs.map(x=>x.id===p.id?{...x,active:e.target.checked}:x))}/> active</label><button className="ghost-button" disabled={busy} onClick={()=>save(p)}>Save</button></div>)}</section>
}
