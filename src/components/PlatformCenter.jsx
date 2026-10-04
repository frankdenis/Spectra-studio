import React,{useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'

export default function PlatformCenter({mode='Notifications',user,onBack,onNotify}){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[query,setQuery]=useState(''),[plans,setPlans]=useState([])
 useEffect(()=>{load()},[mode])
 const load=async()=>{
  if(!supabase||!user)return
  setLoading(true)
  if(mode==='Notifications'){
   const {data,error}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(50);if(error)onNotify?.(error.message);else setItems(data||[])
  } else if(mode==='Billing'){
   const [p,s]=await Promise.all([supabase.from('subscription_plans').select('*').eq('active',true).order('price_cents'),supabase.from('subscriptions').select('*,subscription_plans(*)').eq('user_id',user.id).maybeSingle()]);if(p.error)onNotify?.(p.error.message);setPlans(p.data||[]);if(s.data)setItems([s.data])
  } else if(mode==='Search'){
   const [p,g,m]=await Promise.all([supabase.from('projects').select('id,name,type,status,updated_at').order('updated_at',{ascending:false}).limit(50),supabase.from('generations').select('id,prompt,kind,status,created_at').order('created_at',{ascending:false}).limit(50),supabase.from('media_assets').select('id,name,type,status,created_at').order('created_at',{ascending:false}).limit(50)]);setItems([...(p.data||[]).map(x=>({...x,_type:'project'})),...(g.data||[]).map(x=>({...x,_type:'generation'})),...(m.data||[]).map(x=>({...x,_type:'media'}))])
  } else if(mode==='Security'){
   const {data,error}=await supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(30);if(error)onNotify?.(error.message);else setItems(data||[])
  }
  setLoading(false)
 }
 const filtered=mode==='Search'?items.filter(x=>(String(x.name||'')+' '+String(x.prompt||'')+' '+String(x.type||'')).toLowerCase().includes(query.toLowerCase())):items
 return <section className="platform-center">
  <div className="workspace-panel-head"><div><div className="eyebrow"><span className="eyebrow-line"/> {mode.toUpperCase()}</div><h1>{mode==='Search'?'Find anything in Spectra.':mode==='Notifications'?'Stay in the loop.':mode==='Billing'?'Your plan and usage.':'Security and account activity.'}</h1><p>{mode==='Search'?'Search projects, generations and media in your workspace.':mode==='Notifications'?'System, generation and account notifications.':mode==='Billing'?'Subscription and account billing status.':'Recent security and audit events.'}</p></div><button className="ghost-button" onClick={onBack}>← Back</button></div>
  {mode==='Search'&&<input className="platform-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects, generations, media…" autoFocus/>}
  {mode==='Billing'&&<div className="billing-grid">{plans.map(p=><article key={p.id} className="billing-card"><span>{p.name}</span><strong>{p.monthly_price_ngn===0?'Free':'₦'+Number(p.monthly_price_ngn||0).toLocaleString()}</strong><small>{Array.isArray(p.features)?p.features.slice(0,3).join(' · '):'Spectra subscription plan'}</small><button className="ghost-button" onClick={()=>onNotify?.('Billing checkout is ready for payment-provider connection.')}>Choose plan ↗</button></article>)}{!plans.length&&<div className="studio-empty">No public plans are configured yet.</div>}</div>}
  {mode!=='Billing'&&<div className="platform-list">{loading?<div className="studio-empty">Loading…</div>:!filtered.length?<div className="studio-empty">Nothing to show.</div>:filtered.map(x=><div className="platform-row" key={x.id}><span>{x._type||x.type||x.category||'event'}</span><strong>{x.title||x.name||x.prompt||x.action||'Activity'}</strong><small>{x.status||x.message||''}</small><time>{x.created_at?new Date(x.created_at).toLocaleString():''}</time></div>)}</div>}
 </section>
}
