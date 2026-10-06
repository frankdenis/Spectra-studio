import { spawn } from 'node:child_process'

const processes = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0'], { stdio: 'inherit', env: process.env }),
]

function shutdown(code = 0) {
  for (const child of processes) child.kill('SIGTERM')
  process.exit(code)
}
process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())
processes.forEach((child) => child.on('exit', (code) => { if (code && code !== 0) shutdown(code) }))
