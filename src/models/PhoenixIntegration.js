export const PhoenixIntegration = {
  model: import.meta.env?.VITE_PHOENIX_MODEL || 'phoenix-v1',
  transport: 'webrtc',
  capabilities: ['lip-sync', 'face-landmarks', 'voice-turn-taking', 'emotion-state'],
  createSession({ roomId, avatarId = 'aurora', token } = {}) {
    return { roomId, avatarId, token, sessionId: `px_${Date.now()}`, status: 'initializing', capabilities: this.capabilities }
  },
}

export default PhoenixIntegration
