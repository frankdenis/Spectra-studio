import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve(process.env.DATA_DIR || '.data')
const dataFile = path.join(dataDir, 'helio.json')
const seedState = { rooms: [{ id: 'room_demo', title: 'Aurora / presence room', avatarId: 'aurora', ownerId: 'dev-user', status: 'live', createdAt: new Date().toISOString(), participants: 1, transcript: [] }], events: [] }
function readState() { try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')) } catch { return structuredClone(seedState) } }
let state = readState()
function persist() { if (process.env.PERSIST_DATA === 'false') return; fs.mkdirSync(dataDir, { recursive: true }); const tmp = `${dataFile}.tmp`; fs.writeFileSync(tmp, JSON.stringify(state, null, 2)); fs.renameSync(tmp, dataFile) }
function id(prefix) { return `${prefix}_${crypto.randomBytes(4).toString('hex')}` }
export function publicRoom(room) { const { transcript, ...safe } = room; return safe }
export function listRooms(ownerId) { return state.rooms.filter((room) => !ownerId || room.ownerId === ownerId || room.ownerId === 'dev-user').map(publicRoom) }
export function getRoom(roomId) { return state.rooms.find((room) => room.id === roomId) }
export function createRoom({ title = 'Untitled room', avatarId = 'aurora', ownerId = 'dev-user' } = {}) { const room = { id: id('room'), title, avatarId, ownerId, status: 'ready', participants: 0, transcript: [], createdAt: new Date().toISOString() }; state.rooms.unshift(room); persist(); return publicRoom(room) }
export function addInvite(roomId, email, invitedBy = 'dev-user') { const room = getRoom(roomId); if (!room) return null; const invite = { id: id('invite'), roomId, email, invitedBy, createdAt: new Date().toISOString() }; room.invites = [...(room.invites || []), invite]; persist(); return invite }
export function addRoomEvent(roomId, event) { const room = getRoom(roomId); if (!room) return null; const next = { id: id('event'), roomId, ...event, createdAt: new Date().toISOString() }; room.transcript = [...(room.transcript || []), next].slice(-500); state.events.unshift(next); persist(); return next }
export function getTranscript(roomId) { return getRoom(roomId)?.transcript || [] }
export function health() { return { status: 'ok', service: 'helio-api', timestamp: new Date().toISOString(), rooms: state.rooms.length } }
