const REALTIME_ENDPOINT = '/api/realtime'

export function createRoom({ title = 'Untitled room', avatarId = 'aurora' } = {}) {
  return {
    id: `room_${Math.random().toString(36).slice(2, 8)}`,
    title,
    avatarId,
    endpoint: REALTIME_ENDPOINT,
    createdAt: new Date().toISOString(),
  }
}

export function getConnectionHealth() {
  return { latencyMs: 38, packetLoss: 0.02, status: 'excellent' }
}
