import crypto from 'node:crypto'

const secret = process.env.AUTH_SECRET || 'local-development-secret-change-me'
const isProduction = process.env.NODE_ENV === 'production'

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export function signToken({ sub, name = 'Guest', scope = ['rooms:read', 'rooms:write'] }) {
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ sub, name, scope, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 })
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

export function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.')
    const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (claims.exp < Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}

export function getToken(req) {
  const value = req.headers.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7) : null
}

export function authRequired(req, res, next) {
  const token = getToken(req)
  const claims = token ? verifyToken(token) : null
  if (claims) {
    req.user = claims
    return next()
  }
  if (!isProduction && process.env.ALLOW_DEV_AUTH !== 'false') {
    req.user = { sub: 'dev-user', name: 'Development user', scope: ['*'] }
    return next()
  }
  return res.status(401).json({ error: 'unauthorized', message: 'A valid bearer token is required.' })
}

export function devToken() {
  return signToken({ sub: 'dev-user', name: 'Development user', scope: ['*'] })
}
