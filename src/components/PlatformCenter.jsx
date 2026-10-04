import React,{useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'

export default function PlatformCenter({mode='Notifications',user,onBack,onNotify}){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[query,setQuery]=useState(''),[plans,setPlans]=useState([]),[checkout,setCheckout]=useState(null)
 useEffect(()=>{load()},[mode])
 const load=async()=>{
  if(!supabase||!user)return
  setLoading(true)
  if(mode==='Notifications'){
   const {data,error}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(50);if(error)onNotify?.(error.message);else setItems(data||[])
  } else if(mode==='Billing'){
   const [p,s]=await Promise.all([
    supabase.from('subscription_plans').select('*').eq('active',true).order('monthly_price_ngn'),
    supabase.from('subscriptions').select('*,subscription_plans(*)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle()
   ])
   if(p.error)onNotify?.(p.error.message);setPlans(p.data||[]);if(s.data)setItems([s.data])
  } else if(mode==='Search'){
   const [p,g,m]=await Promise.all([
    supabase.from('projects').select('id,name,type,status,updated_at').order('updated_at',{ascending:false}).limit(50),
    supabase.from('generations').select('id,prompt,kind,status,created_at').order('created_at',{ascending:false}).limit(50),
    supabase.from('media_assets').select('id,kind,provider,processing_status,created_at').order('created_at',{ascending:false}).limit(50)
   ])
   setItems([...(p.data||[]).map(x=>({...x,_type:'project'})),...(g.data||[]).map(x=>({...x,_type:'generation'})),...(m.data||[]).map(x=>({...x,_type:'media'}))])
  } else if(mode==='Security'){
   const {data,error}=await supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(30);if(error)onNotify?.(error.message);else setItems(data||[])
  }
  setLoading(false)
 }
 const startCheckout=async(planId)=>{
  if(!supabase||!user)return
  setCheckout(planId)
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session)throw new Error('Please sign in again.')
   const {data,error}=await supabase.functions.invoke('paystack-checkout',{body:{planId,callbackUrl:window.location.href}})
   if(error)throw error
   if(!data?.authorization_url)throw new Error(data?.error||'Payment checkout was not created.')
   window.location.assign(data.authorization_url)
  }catch(error){onNotify?.(error.message||'Unable to start payment.');setCheckout(null)}
 }
 const filtered=mode==='Search'?items.filter(x=>(String(x.name||'')+' '+String(x.prompt||'')+' '+String(x.kind||'')).toLowerCase().includes(query.toLowerCase())):items
 return <section className="platform-center">
  <div className="workspace-panel-head"><div><div className="eyebrow"><span className="eyebrow-line"/> {mode.toUpperCase()}</div><h1>{mode==='Search'?'Find anything in Spectra.':mode==='Notifications'?'Stay in the loop.':mode==='Billing'?'Your plan and usage.':'Security and account activity.'}</h1><p>{mode==='Search'?'Search projects, generations and media in your workspace.':mode==='Notifications'?'System, generation and account notifications.':mode==='Billing'?'Subscription and account billing status.':'Recent security and audit events.'}</p></div><button className="ghost-button" onClick={onBack}>← Back</button></div>
  {mode==='Search'&&<input className="platform-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects, generations, media…" autoFocus/>}
  {mode==='Billing'&&<div className="billing-grid">{plans.map(p=><article key={p.id} className="billing-card"><span>{p.name}</span><strong>{p.monthly_price_ngn===0?'Free':'₦'+Number(p.monthly_price_ngn||0).toLocaleString()}</strong><small>{Array.isArray(p.features)?p.features.slice(0,3).join(' · '):'Spectra subscription plan'}</small><button className="ghost-button" disabled={checkout===p.id||Number(p.monthly_price_ngn||0)<=0} onClick={()=>startCheckout(p.id)}>{checkout===p.id?'Opening checkout…':Number(p.monthly_price_ngn||0)<=0?'Current free plan':'Choose plan ↗'}</button></article>)}{!plans.length&&<div className="studio-empty">No public plans are configured yet.</div>}</div>}
  {mode!=='Billing'&&<div className="platform-list">{loading?<div className="studio-empty">Loading…</div>:!filtered.length?<div className="studio-empty">Nothing to show.</div>:filtered.map(x=><div className="platform-row" key={x.id}><span>{x._type||x.kind||x.type||'event'}</span><strong>{x.title||x.name||x.prompt||x.action||'Activity'}</strong><small>{x.status||x.processing_status||x.message||''}</small><time>{x.created_at?new Date(x.created_at).toLocaleString():''}</time></div>)}</div>}
 </section>
}