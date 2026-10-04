export function createRealtimeSync({ onEvent } = {}) {
  let connected = false
  let timer
  return {
    connect() {
      connected = true
      onEvent?.({ type: 'connected', at: Date.now() })
      timer = setInterval(() => onEvent?.({ type: 'presence', value: Math.round(92 + Math.random() * 7) }), 5000)
    },
    disconnect() {
      connected = false
      clearInterval(timer)
      onEvent?.({ type: 'disconnected', at: Date.now() })
    },
    status() { return connected ? 'connected' : 'disconnected' },
  }
}
