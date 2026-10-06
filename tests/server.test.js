import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

const port = 3311
let child

test.before(async () => {
  child = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: '.data-test', PERSIST_DATA: 'false' } })
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('API server did not start')), 5000)
    child.stdout.on('data', (chunk) => { if (String(chunk).includes('listening')) { clearTimeout(timer); resolve() } })
    child.on('error', reject)
  })
})

test.after(() => child?.kill('SIGTERM'))

test('health endpoint is live', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/health`)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.status, 'ok')
})

test('development auth can create and list rooms', async () => {
  const tokenResponse = await fetch(`http://127.0.0.1:${port}/api/auth/dev`, { method: 'POST' })
  const { token } = await tokenResponse.json()
  const roomsResponse = await fetch(`http://127.0.0.1:${port}/api/rooms`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(roomsResponse.status, 200)
  const body = await roomsResponse.json()
  assert.ok(Array.isArray(body.rooms))
})
