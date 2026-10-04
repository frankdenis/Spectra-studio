import { supabase } from '../lib/supabase'

export function createRealtimeSync({ onEvent, roomId } = {}) {
  let channel = null
  return {
    async connect() {
      if (!supabase || !roomId) {
        onEvent?.({ type: 'disconnected', reason: 'realtime_not_configured' })
        return null
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        onEvent?.({ type: 'disconnected', reason: 'authentication_required' })
        return null
      }

      channel = supabase.channel(`room:${roomId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const count = Object.values(state).reduce((sum, entries) => sum + entries.length, 0)
          onEvent?.({ type: 'presence', value: count })
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ userId: user.id, joinedAt: new Date().toISOString() })
            onEvent?.({ type: 'connected', status })
          } else {
            onEvent?.({ type: 'disconnected', status })
          }
        })

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
