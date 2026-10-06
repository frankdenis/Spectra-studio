import { supabase } from '../lib/supabase.js'

export async function getAvatarProfile(avatarId = 'aurora', token) {
  if (supabase) {
    const { data, error } = await supabase.from('ai_identities').select('id,name,status,provider,provider_identity_id,metadata').eq('id', avatarId).single()
    if (error) throw error
    return data
  }
  const response = await fetch(`/api/avatar/${encodeURIComponent(avatarId)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Avatar profile request failed.')
  return data
}

export async function createAvatarIdentity({ name, sourceUrl, sourceType = 'image', consent = false }) {
  if (!consent) throw new Error('Explicit consent is required.')
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sign in is required.')
  const response = await fetch('/api/tavus/face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ name, sourceUrl, sourceType, consent }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Avatar creation failed.')
  return data
}

export async function setAvatarExpression(avatarId, expression, token) {
  if (supabase) {
    const { error } = await supabase.from('ai_identities').update({ metadata: { expression } }).eq('id', avatarId)
    if (error) throw error
  }
  return { avatarId, expression, tokenPresent: Boolean(token), acceptedAt: new Date().toISOString() }
}
