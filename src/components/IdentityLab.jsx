import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const bucket = 'identity-assets'

export default function IdentityLab({ user, onBack, onNotify }) {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('My Spectra Identity')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const submit = async () => {
    if (!file || !consent || !supabase) return
    setBusy(true); setResult(null)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${user.id}/identity-${crypto.randomUUID()}.${ext}`
      const upload = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type })
      if (upload.error) throw upload.error
      const signed = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
      if (signed.error) throw signed.error
      const response = await fetch('/api/tavus/face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}` },
        body: JSON.stringify({ name, sourceUrl: signed.data.signedUrl, sourceType: file.type.startsWith('video/') ? 'video' : 'image', consent: true }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Identity processing failed.')
      setResult(data)
      onNotify('Identity processing started. You will be notified when the replica is ready.')
    } catch (error) { setResult({ error: error.message || 'Identity processing failed.' }) }
    finally { setBusy(false) }
  }

  return <section className="workspace-panel"><div className="workspace-panel-head"><div><div className="eyebrow"><span className="eyebrow-line" /> IDENTITY LAB</div><h1>Build your real AI presence.</h1><p>Upload a high-quality photo or training video. The provider creates a photorealistic identity; a training video can also produce a custom voice from its audio.</p></div><button className="ghost-button" onClick={onBack}>← Back to dashboard</button></div><div className="avatar-lab"><div className="media-dropzone"><strong>Source media</strong><p>Use only media you own or have explicit permission to use.</p><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Identity name" /><input type="file" accept="image/jpeg,image/png,video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0] || null)} /><p>{file ? `${file.name} · ${Math.round(file.size / 1024 / 1024 * 10) / 10} MB` : 'JPEG/PNG image or MP4/WebM training video'}</p></div><div className="media-dropzone"><strong>Rights & consent</strong><p>The uploaded likeness and voice must belong to you or be submitted with the subject’s permission. Spectra records this consent with the processing request.</p><label className="consent-line"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} /> I confirm I have the rights and consent required to create this AI identity and voice.</label><button className="primary-button" disabled={!file || !consent || busy} onClick={submit}>{busy ? 'Submitting securely…' : 'Create AI identity'} <span>↗</span></button>{result?.error && <div className="auth-message">{result.error}</div>}{result?.faceId && <div className="auth-message">Processing started · Face ID {result.faceId}</div>}</div></div></section>
}
