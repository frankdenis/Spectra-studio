import test from 'node:test'
import assert from 'node:assert/strict'
import { signToken, verifyToken } from '../server/auth.js'

test('signed auth tokens verify and expose claims', () => {
  const token = signToken({ sub: 'test-user', name: 'Test User' })
  const claims = verifyToken(token)
  assert.equal(claims.sub, 'test-user')
  assert.equal(claims.name, 'Test User')
})

test('tampered tokens are rejected', () => {
  const token = signToken({ sub: 'test-user' })
  assert.equal(verifyToken(`${token}x`), null)
})
