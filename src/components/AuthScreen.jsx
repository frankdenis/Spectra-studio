import React, { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AUTH_REDIRECT_URL = import.meta.env.VITE_AUTH_REDIRECT_URL || 'https://spectra-studio-frankdennis67.vercel.app'

export default function AuthScreen({ onAuthenticated, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMode(initialMode)
    setMessage('')
  }, [initialMode])

  if (!isSupabaseConfigured) return <main className="auth-screen"><div className="auth-card"><div className="brand-lockup auth-brand"><span className="brand-mark"><i /><i /><i /></span><span>spectra<span className="brand-dot">.</span></span></div><span className="auth-kicker">PRODUCTION AUTHENTICATION</span><h1>Connect Spectra securely.</h1><p>Supabase authentication is required before users can enter the workspace. No demo credentials are used.</p><div className="auth-requirement"><strong>Required environment</strong><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></div></div></main>

  const showMessage = (text) => setMessage(text)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: AUTH_REDIRECT_URL,
        })
        if (error) throw error
        showMessage('Password reset email sent. Check your inbox and follow the secure link.')
        return
      }

      if (mode === 'reset') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        if (password !== confirmPassword) throw new Error('Passwords do not match.')
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setPassword('')
        setConfirmPassword('')
        showMessage('Password updated successfully. You can continue to Spectra Studio.')
        window.setTimeout(() => onAuthenticated(null), 900)
        return
      }

      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name },
              emailRedirectTo: AUTH_REDIRECT_URL,
            },
          })

      if (result.error) throw result.error

      if (mode === 'signup' && !result.data.session) {
        showMessage('Account created. Check your email to confirm your address.')
      } else {
        onAuthenticated(result.data.session)
      }
    } catch (error) {
      const errorMessage = error.message || 'Authentication failed.'
      if (mode === 'signin' && /email not confirmed/i.test(errorMessage)) {
        showMessage('Your email is not confirmed yet. Check your inbox, or resend the confirmation email below.')
      } else {
        showMessage(errorMessage)
      }
    } finally {
      setBusy(false)
    }
  }

  const continueWithGoogle = async () => {
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: AUTH_REDIRECT_URL },
      })
      if (error) throw error
    } catch (error) {
      showMessage(error.message || 'Google sign-in failed.')
      setBusy(false)
    }
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  const title = mode === 'signin'
    ? 'Welcome back.'
    : mode === 'signup'
      ? 'Create your workspace.'
      : mode === 'forgot'
        ? 'Reset your password.'
        : 'Choose a new password.'

  const copy = mode === 'signin'
    ? 'Sign in to continue to your private AI video workspace.'
    : mode === 'signup'
      ? 'Create a secure account. Your workspace starts private.'
      : mode === 'forgot'
        ? 'Enter your email and we will send a secure password reset link.'
        : 'Set a new password for your Spectra Studio account.'

  return <main className="auth-screen">
    <div className="auth-card">
      <div className="brand-lockup auth-brand"><span className="brand-mark"><i /><i /><i /></span><span>spectra<span className="brand-dot">.</span></span></div>
      <span className="auth-kicker">SPECTRA STUDIO</span>
      <h1>{title}</h1>
      <p>{copy}</p>

      {mode !== 'forgot' && mode !== 'reset' && <button type="button" className="google-auth-button" onClick={continueWithGoogle} disabled={busy}><span className="google-mark">G</span> Continue with Google <span>↗</span></button>}

      {mode !== 'forgot' && mode !== 'reset' && <div className="auth-divider"><span>or continue with email</span></div>}

      <form onSubmit={submit}>
        {mode === 'signup' && <label className="input-label">Full name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" /></label>}

        {mode !== 'reset' && <label className="input-label">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" disabled={mode === 'reset'} /></label>}

        {mode !== 'forgot' && <label className="input-label">Password<input required minLength="8" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='signin'?'current-password':'new-password'} /></label>}

        {mode === 'reset' && <label className="input-label">Confirm new password<input required minLength="8" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" /></label>}

        {message && <div className="auth-message">{message}</div>}

        <button className="primary-button auth-submit" disabled={busy}>
          {busy ? 'Securing session…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Update password'} <span>↗</span>
        </button>
      </form>

      {mode === 'signin' && <button className="auth-link" type="button" onClick={()=>switchMode('forgot')}>Forgot your password?</button>}
      {mode === 'signin' && message.toLowerCase().includes('not confirmed') && <button className="auth-link" type="button" disabled={busy} onClick={async ()=>{
        setBusy(true)
        try {
          const { error } = await supabase.auth.resend({ type: 'signup', email })
          if (error) throw error
          showMessage('A fresh confirmation email has been sent. Open it from the live Spectra Studio link.')
        } catch (error) {
          showMessage(error.message || 'Could not resend the confirmation email.')
        } finally {
          setBusy(false)
        }
      }}>Resend confirmation email</button>}

      {mode === 'forgot' && <button className="auth-switch" type="button" onClick={()=>switchMode('signin')}>← Back to sign in</button>}

      {mode === 'reset' && <button className="auth-switch" type="button" onClick={()=>switchMode('signin')}>Back to sign in</button>}

      {mode !== 'forgot' && mode !== 'reset' && <div className="auth-mode-tabs"><button type="button" className={mode==='signin' ? 'is-active' : ''} onClick={()=>switchMode('signin')}>Sign in</button><button type="button" className={mode==='signup' ? 'is-active' : ''} onClick={()=>switchMode('signup')}>Create account</button></div>}
    </div>
  </main>
}
