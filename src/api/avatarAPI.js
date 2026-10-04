const AVATAR_ENDPOINT = '/api/avatar'

export async function getAvatarProfile(avatarId = 'aurora') {
  // Replace with a real fetch when the avatar gateway is deployed.
  return { id: avatarId, name: 'Aurora', voice: 'solace', model: 'phoenix-v1', endpoint: AVATAR_ENDPOINT }
}

export async function setAvatarExpression(avatarId, expression) {
  return { avatarId, expression, acceptedAt: new Date().toISOString() }
}
