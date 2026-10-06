import http from 'node:http'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { addInvite, addRoomEvent, createRoom, getRoom, getTranscript, health, listRooms, publicRoom } from './store.js'
import { authRequired, devToken, getToken, verifyToken } from './auth.js'

const app = express()
const server = http.createServer(app)
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '0.0.0.0'
const clients = new Map()

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

app.get('/health', (_req, res) => res.json(health()))
app.post('/api/auth/dev', (_req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'not_found' })
  res.json({ token: devToken(), expiresIn: 3600 })
})
app.get('/api/me', authRequired, (req, res) => res.json({ id: req.user.sub, name: req.user.name, scope: req.user.scope }))
app.get('/api/rooms', authRequired, (req, res) => res.json({ rooms: listRooms(req.user.sub) }))
app.post('/api/rooms', authRequired, (req, res) => {
  const room = createRoom({ title: req.body?.title, avatarId: req.body?.avatarId, ownerId: req.user.sub })
  res.status(201).json({ room })
})
app.get('/api/rooms/:roomId', authRequired, (req, res) => {
  const room = getRoom(req.params.roomId)
  if (!room) return res.status(404).json({ error: 'room_not_found' })
  res.json({ room: publicRoom(room) })
})
app.post('/api/rooms/:roomId/invites', authRequired, (req, res) => {
  const email = String(req.body?.email || '').trim()
  if (!email || email.length > 160) return res.status(400).json({ error: 'valid_email_required' })
  const invite = addInvite(req.params.roomId, email, req.user.sub)
  if (!invite) return res.status(404).json({ error: 'room_not_found' })
  res.status(201).json({ invite })
})
app.get('/api/rooms/:roomId/transcript', authRequired, (req, res) => res.json({ transcript: getTranscript(req.params.roomId) }))
app.post('/api/rooms/:roomId/events', authRequired, (req, res) => {
  const event = addRoomEvent(req.params.roomId, { actorId: req.user.sub, type: req.body?.type || 'note', text: String(req.body?.text || '').slice(0, 4000) })
  if (!event) return res.status(404).json({ error: 'room_not_found' })
  res.status(201).json({ event })
})
app.get('/api/avatar/:avatarId', authRequired, (req, res) => res.json({ id: req.params.avatarId, name: 'Aurora', model: 'phoenix-v1', capabilities: ['lip-sync', 'face-landmarks', 'voice-turn-taking', 'emotion-state'] }))

const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 })
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`)
  if (url.pathname !== '/ws') return socket.destroy()
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request))
})

function broadcast(roomId, message, sender) {
  const raw = JSON.stringify(message)
  for (const client of wss.clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN && clients.get(client)?.roomId === roomId) client.send(raw)
  }
}

wss.on('connection', (ws, request) => {
  let client = { roomId: null, userId: null }
  clients.set(ws, client)
  ws.send(JSON.stringify({ type: 'connected', at: Date.now() }))

  ws.on('message', (raw) => {
    let message
    try { message = JSON.parse(raw.toString()) } catch { return ws.send(JSON.stringify({ type: 'error', message: 'invalid_json' })) }
    if (message.type === 'join') {
      const tokenClaims = message.token ? verifyToken(message.token) : null
      if (process.env.NODE_ENV === 'production' && !tokenClaims) return ws.close(4401, 'unauthorized')
      const room = getRoom(String(message.roomId || 'room_demo'))
      if (!room) return ws.send(JSON.stringify({ type: 'error', message: 'room_not_found' }))
      client = { roomId: room.id, userId: tokenClaims?.sub || 'dev-user', clientId: message.clientId || `client_${Date.now()}` }
      clients.set(ws, client)
      ws.send(JSON.stringify({ type: 'joined', roomId: room.id, clientId: client.clientId, peers: [...clients.values()].filter((item) => item.roomId === room.id).length - 1 }))
      broadcast(room.id, { type: 'peer-joined', clientId: client.clientId }, ws)
      return
    }
    if (!client.roomId) return ws.send(JSON.stringify({ type: 'error', message: 'join_required' }))
    if (['offer', 'answer', 'ice', 'presence', 'chat', 'leave'].includes(message.type)) broadcast(client.roomId, { ...message, from: client.clientId }, ws)
  })

  ws.on('close', () => {
    if (client.roomId) broadcast(client.roomId, { type: 'peer-left', clientId: client.clientId }, ws)
    clients.delete(ws)
  })
})

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue }
    ws.isAlive = false
    ws.ping()
  }
}, 30000)
wss.on('connection', (ws) => { ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true }) })

server.listen(port, host, () => console.log(`Helio API listening on http://${host}:${port}`))

function shutdown() {
  clearInterval(heartbeat)
  for (const ws of wss.clients) ws.close(1001, 'server_shutdown')
  server.close(() => process.exit(0))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
