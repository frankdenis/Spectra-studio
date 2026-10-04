import { supabase } from '../lib/supabase'

export async function getAvatarProfile(avatarId) {
  if (!supabase || !avatarId) throw new Error('Supabase and an avatar ID are required.')
  const { data, error } = await supabase.from('ai_identities').select('id,name,status,provider,provider_identity_id,metadata').eq('id',avatarId).single()
  if (error) throw error
  return data
}

export async function createAvatarIdentity({ name, sourceUrl, sourceType = 'image', consent = false }) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!consent) throw new Error('Explicit consent is required.')
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

export async function setAvatarExpression(avatarId, expression) {
  if (!supabase || !avatarId) throw new Error('Supabase and an avatar ID are required.')
  const { error } = await supabase.from('ai_identities').update({ metadata: { expression } }).eq('id', avatarId)
  if (error) throw error
  return { avatarId, expression, acceptedAt: new Date().toISOString() }
}