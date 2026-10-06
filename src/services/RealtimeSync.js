import { supabase } from '../lib/supabase.js'

function startWebSocketFallback({ onEvent, roomId, token, clientId }) {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
    onEvent?.({ type: 'disconnected', reason: 'websocket_unavailable' })
    return { socket: null, stop: () => {}, status: () => 'disconnected', send: () => {} }
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws`)
  let connected = false
  socket.addEventListener('open', () => { connected = true; socket.send(JSON.stringify({ type: 'join', roomId: roomId || 'room_demo', token, clientId })) })
  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data)
      onEvent?.(message.type === 'joined' ? { type: 'connected', transport: 'websocket', ...message } : message)
    } catch { /* Ignore malformed peer messages. */ }
  })
  socket.addEventListener('error', () => onEvent?.({ type: 'transport-error' }))
  socket.addEventListener('close', () => { connected = false; onEvent?.({ type: 'disconnected' }) })
  return {
    socket,
    stop: () => socket.close(1000, 'client_disconnect'),
    status: () => connected ? 'connected' : 'connecting',
    send: (type, payload = {}) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...payload })) },
  }
}

export function createRealtimeSync({ onEvent, roomId, token, clientId = `web_${Math.random().toString(36).slice(2, 8)}` } = {}) {
  let channel = null
  let fallback = null
  let connectionStatus = 'disconnected'

  return {
    async connect() {
      if (supabase && roomId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { onEvent?.({ type: 'disconnected', reason: 'authentication_required' }); return null }
        channel = supabase.channel(`room:${roomId}`)
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const count = Object.values(state).reduce((sum, entries) => sum + entries.length, 0)
            onEvent?.({ type: 'presence', value: count })
          })
          .on('broadcast', { event: 'signal' }, ({ payload }) => onEvent?.(payload))
          .subscribe(async (status) => {
            connectionStatus = status === 'SUBSCRIBED' ? 'connected' : 'connecting'
            if (status === 'SUBSCRIBED') {
              await channel.track({ userId: user.id, joinedAt: new Date().toISOString() })
              onEvent?.({ type: 'connected', transport: 'supabase', status })
            } else onEvent?.({ type: 'disconnected', status })
          })
        return channel
      }
      fallback = startWebSocketFallback({ onEvent, roomId, token, clientId })
      return fallback.socket
    },
    async disconnect() {
      if (channel && supabase) await supabase.removeChannel(channel)
      channel = null
      fallback?.stop()
      fallback = null
      connectionStatus = 'disconnected'
      onEvent?.({ type: 'disconnected', at: Date.now() })
    },
    send(type, payload = {}) {
      if (channel) channel.send({ type: 'broadcast', event: 'signal', payload: { type, ...payload } })
      else fallback?.send(type, payload)
    },
    status() { return channel ? connectionStatus : fallback?.status() || 'disconnected' },
  }
}
