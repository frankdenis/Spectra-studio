import React, { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (!isSupabaseConfigured) return <main className="auth-screen"><div className="auth-card"><div className="brand-lockup auth-brand"><span className="brand-mark"><i /><i /><i /></span><span>spectra<span className="brand-dot">.</span></span></div><span className="auth-kicker">PRODUCTION AUTHENTICATION</span><h1>Connect Spectra securely.</h1><p>Supabase authentication is required before users can enter the workspace. No demo credentials are used.</p><div className="auth-requirement"><strong>Required environment</strong><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></div></div></main>

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true); setMessage('')
    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (result.error) throw result.error
      if (mode === 'signup' && !result.data.session) setMessage('Account created. Check your email to confirm your address.')
      else onAuthenticated(result.data.session)
    } catch (error) { setMessage(error.message || 'Authentication failed.') }
    finally { setBusy(false) }
  }

  return <main className="auth-screen"><div className="auth-card"><div className="brand-lockup auth-brand"><span className="brand-mark"><i /><i /><i /></span><span>spectra<span className="brand-dot">.</span></span></div><span className="auth-kicker">SPECTRA STUDIO</span><h1>{mode === 'signin' ? 'Welcome back.' : 'Create your workspace.'}</h1><p>{mode === 'signin' ? 'Sign in to continue to your private AI video workspace.' : 'Create a secure account. Your workspace starts private.'}</p><form onSubmit={submit}>{mode === 'signup' && <label className="input-label">Full name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" /></label>}<label className="input-label">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></label><label className="input-label">Password<input required minLength="8" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='signin'?'current-password':'new-password'} /></label>{message && <div className="auth-message">{message}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'Securing session…' : mode === 'signin' ? 'Sign in' : 'Create account'} <span>↗</span></button></form><button className="auth-switch" type="button" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}}>{mode==='signin' ? 'Need an account? Create one' : 'Already registered? Sign in'}</button></div></main>
}
