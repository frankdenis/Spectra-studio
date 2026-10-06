import { supabase } from '../lib/supabase.js'

async function request(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.error || `Request failed: ${response.status}`)
  return body
}

export async function createRoom({ title = 'Untitled room', avatarId = 'aurora' } = {}) {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sign in is required.')
    const { data, error } = await supabase.from('rooms').insert({ owner_id: user.id, title, status: 'created' }).select('id,title,status,created_at').single()
    if (error) throw error
    return { id: data.id, title: data.title, avatarId, status: data.status, createdAt: data.created_at }
  }
  const { room } = await request('/api/rooms', { method: 'POST', body: JSON.stringify({ title, avatarId }) })
  return room
}

export async function listRooms(token) {
  if (supabase) {
    const { data, error } = await supabase.from('rooms').select('id,title,status,created_at').order('created_at', { ascending: false })
    if (error) throw error
    return { rooms: data }
  }
  return request('/api/rooms', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
}

export async function getRemoteHealth() { return request('/health') }

export function getConnectionHealth(stats) {
  if (!stats) return { latencyMs: null, packetLoss: null, status: 'waiting for realtime media' }
  return stats
}
