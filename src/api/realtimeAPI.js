import { supabase } from '../lib/supabase'

export async function createRoom({ title = 'Untitled room', avatarId = 'aurora' } = {}) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in is required.')
  const { data, error } = await supabase.from('rooms').insert({ owner_id: user.id, title, status: 'created' }).select('id,title,status,created_at').single()
  if (error) throw error
  return { id: data.id, title: data.title, avatarId, status: data.status, createdAt: data.created_at }
}

export function getConnectionHealth(stats) {
  if (!stats) return { latencyMs: null, packetLoss: null, status: 'waiting for realtime media' }
  return stats
}
