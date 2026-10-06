const AVATAR_ENDPOINT = '/api/avatar'

async function request(path, options = {}) {
  const response = await fetch(path, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.error || `Avatar request failed: ${response.status}`)
  return body
}

export async function getAvatarProfile(avatarId = 'aurora', token) {
  return request(`${AVATAR_ENDPOINT}/${encodeURIComponent(avatarId)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
}

export async function setAvatarExpression(avatarId, expression, token) {
  return { avatarId, expression, tokenPresent: Boolean(token), acceptedAt: new Date().toISOString() }
}
