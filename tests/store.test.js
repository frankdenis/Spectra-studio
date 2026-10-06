import test from 'node:test'
import assert from 'node:assert/strict'
import { createRoom, getRoom, addInvite } from '../server/store.js'

test('room store creates rooms and invites', () => {
  const room = createRoom({ title: 'Store test', ownerId: 'test-user' })
  assert.equal(getRoom(room.id).title, 'Store test')
  const invite = addInvite(room.id, 'person@example.com', 'test-user')
  assert.equal(invite.email, 'person@example.com')
})
