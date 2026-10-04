export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { faceId, palId, name, participantTag } = req.body || {}
  if (!token || !faceId || !palId) return res.status(400).json({ error: 'Authenticated session, faceId and palId are required.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return res.status(503).json({ error: 'Supabase server configuration is missing.' })
  if (!process.env.TAVUS_API_KEY) return res.status(503).json({ error: 'Tavus is not configured on the server.' })

  const authResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!authResponse.ok) return res.status(401).json({ error: 'Invalid session.' })
  const user = await authResponse.json()

  const limitsResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/user_limits?select=unlimited,monthly_ai_minutes,max_participants&user_id=eq.${encodeURIComponent(user.id)}`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
  })
  const limits = await limitsResponse.json()
  if (!limitsResponse.ok || !limits[0]) return res.status(403).json({ error: 'Usage limits are not configured for this account.' })

  const body = {
    face_id: faceId,
    pal_id: palId,
    conversation_name: String(name || 'Spectra Studio Room').slice(0, 100),
    require_auth: true,
    max_participants: Math.max(2, Number(limits[0].max_participants || 4)),
    participant_tags: participantTag ? [String(participantTag).slice(0, 120)] : undefined,
  }

  const provider = await fetch('https://tavusapi.com/v2/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TAVUS_API_KEY },
    body: JSON.stringify(body),
  })
  const data = await provider.json()
  return res.status(provider.status).json({ ...data, ownerId: user.id })
}
