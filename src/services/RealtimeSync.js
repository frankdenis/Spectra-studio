import { supabase } from '../lib/supabase'

export function createRealtimeSync({ onEvent, roomId } = {}) {
  let channel = null
  return {
    async connect() {
      if (!supabase || !roomId) return onEvent?.({ type: 'disconnected', reason: 'realtime_not_configured' })
      channel = supabase.channel(`room:${roomId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const count = Object.values(state).reduce((sum, entries) => sum + entries.length, 0)
          onEvent?.({ type: 'presence', value: count })
        })
        .subscribe((status) => onEvent?.({ type: status === 'SUBSCRIBED' ? 'connected' : 'disconnected', status }))
      return channel
    },
    async disconnect() {
      if (channel && supabase) await supabase.removeChannel(channel)
      channel = null
      onEvent?.({ type: 'disconnected', at: Date.now() })
    },
    status() { return channel ? 'connected' : 'disconnected' },
  }
}
