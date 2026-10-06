import test from 'node:test'
import assert from 'node:assert/strict'
import { createRoom, getConnectionHealth } from '../src/api/realtimeAPI.js'

test('realtime API exposes room and health methods', () => {
  assert.equal(typeof createRoom, 'function')
  const health = getConnectionHealth()
  assert.equal(health.status, 'waiting for realtime media')
  assert.equal(health.latencyMs, null)
})
