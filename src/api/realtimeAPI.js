const REALTIME_ENDPOINT = '/api/realtime'

export function createRoom({ title = 'Untitled room', avatarId = 'aurora' } = {}) {
  return { id: `room_${Math.random().toString(36).slice(2, 8)}`, title, avatarId, endpoint: REALTIME_ENDPOINT, createdAt: new Date().toISOString() }
}

async function request(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.error || `Request failed: ${response.status}`)
  return body
}

export async function getDevToken() { return request('/api/auth/dev', { method: 'POST' }) }
export async function listRooms(token) { return request('/api/rooms', { headers: token ? { Authorization: `Bearer ${token}` } : {} }) }
export async function createRemoteRoom({ title, avatarId, token } = {}) { return request('/api/rooms', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify({ title, avatarId }) }) }
export async function getRemoteHealth() { return request('/health') }
export function getConnectionHealth() { return { latencyMs: 38, packetLoss: 0.02, status: 'excellent' } }
