function fallbackPresence(onEvent) {
  onEvent?.({ type: 'connected', transport: 'fallback', at: Date.now() })
  return setInterval(() => onEvent?.({ type: 'presence', value: Math.round(92 + Math.random() * 7) }), 5000)
}

export function createRealtimeSync({ onEvent, roomId = 'room_demo', token, clientId = `web_${Math.random().toString(36).slice(2, 8) }` } = {}) {
  let socket
  let fallbackTimer
  let connected = false

  return {
    connect() {
      if (typeof WebSocket === 'undefined') {
        fallbackTimer = fallbackPresence(onEvent)
        return
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${window.location.host}/ws`)
      socket.addEventListener('open', () => {
        connected = true
        socket.send(JSON.stringify({ type: 'join', roomId, token, clientId }))
      })
      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'joined') onEvent?.({ type: 'connected', transport: 'websocket', ...message })
          else onEvent?.(message)
        } catch { /* Ignore malformed events from an incompatible peer. */ }
      })
      socket.addEventListener('error', () => {
        if (!fallbackTimer) fallbackTimer = fallbackPresence(onEvent)
        onEvent?.({ type: 'transport-error' })
      })
      socket.addEventListener('close', () => {
        connected = false
        onEvent?.({ type: 'disconnected' })
      })
    },
    send(type, payload = {}) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...payload }))
    },
    disconnect() {
      clearInterval(fallbackTimer)
      socket?.close(1000, 'client_disconnect')
      connected = false
    },
    status() { return connected ? 'connected' : 'disconnected' },
  }
}
