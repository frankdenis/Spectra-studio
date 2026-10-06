export function createWebRTCSession({ sync, onRemoteStream, onStateChange, iceServers } = {}) {
  let peer
  let localStream

  const config = { iceServers: iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] }

  function ensurePeer() {
    if (peer || typeof RTCPeerConnection === 'undefined') return peer
    peer = new RTCPeerConnection(config)
    peer.onicecandidate = (event) => { if (event.candidate) sync?.send('ice', { candidate: event.candidate }) }
    peer.ontrack = (event) => onRemoteStream?.(event.streams[0])
    peer.onconnectionstatechange = () => onStateChange?.(peer.connectionState)
    return peer
  }

  return {
    async attachLocalStream(stream) {
      localStream = stream
      const connection = ensurePeer()
      if (!connection || !stream) return
      stream.getTracks().forEach((track) => connection.addTrack(track, stream))
    },
    async createOffer() {
      const connection = ensurePeer()
      if (!connection) return null
      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)
      sync?.send('offer', { description: connection.localDescription })
      return offer
    },
    async handleSignal(message) {
      const connection = ensurePeer()
      if (!connection) return
      if (message.type === 'offer') {
        await connection.setRemoteDescription(message.description)
        const answer = await connection.createAnswer()
        await connection.setLocalDescription(answer)
        sync?.send('answer', { description: connection.localDescription })
      } else if (message.type === 'answer') {
        await connection.setRemoteDescription(message.description)
      } else if (message.type === 'ice' && message.candidate) {
        await connection.addIceCandidate(message.candidate)
      }
    },
    close() {
      localStream?.getTracks().forEach((track) => track.stop())
      peer?.close()
      peer = null
    },
  }
}
