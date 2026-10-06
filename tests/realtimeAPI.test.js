import test from 'node:test'
import assert from 'node:assert/strict'
import { createRoom, getConnectionHealth } from '../src/api/realtimeAPI.js'

test('createRoom returns a usable room descriptor', () => {
  const room = createRoom({ title: 'Test room', avatarId: 'aurora' })
  assert.match(room.id, /^room_/)
  assert.equal(room.title, 'Test room')
  assert.equal(room.avatarId, 'aurora')
})

test('connection health exposes stable transport fields', () => {
  const health = getConnectionHealth()
  assert.equal(health.status, 'excellent')
  assert.equal(typeof health.latencyMs, 'number')
  assert.equal(typeof health.packetLoss, 'number')
})
