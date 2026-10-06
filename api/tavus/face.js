export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  const { name, sourceUrl, sourceType, consent } = req.body || {}

  if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return res.status(503).json({ error: 'Authenticated server configuration is incomplete.' })
  }
  if (consent !== true) return res.status(400).json({ error: 'Explicit likeness and voice consent is required.' })
  if (!sourceUrl || !/^https:\/\//i.test(sourceUrl) || !['image', 'video'].includes(sourceType)) {
    return res.status(400).json({ error: 'A secure HTTPS image or video source is required.' })
  }
  if (!process.env.TAVUS_API_KEY) return res.status(503).json({ error: 'Tavus is not configured on the server.' })

  const authResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!authResponse.ok) return res.status(401).json({ error: 'Invalid session.' })
  const user = await authResponse.json()

  const limitsResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/user_limits?select=unlimited,monthly_avatar_minutes&user_id=eq.${encodeURIComponent(user.id)}`,
    { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } },
  )
  if (!limitsResponse.ok) return res.status(403).json({ error: 'Usage limits could not be verified.' })
  const limits = await limitsResponse.json()
  if (!limits[0]) return res.status(403).json({ error: 'Usage limits are not configured for this account.' })
  if (!limits[0].unlimited && Number(limits[0].monthly_avatar_minutes || 0) <= 0) {
    return res.status(402).json({ error: 'Your avatar allowance is exhausted.' })
  }

  const body = {
    face_name: String(name || 'Spectra Identity').trim().slice(0, 80),
    model_name: process.env.TAVUS_FACE_MODEL || 'phoenix-4.5',
  }
  if (sourceType === 'video') {
    body.train_video_url = sourceUrl
  } else {
    body.train_image_url = sourceUrl
    if (!process.env.TAVUS_DEFAULT_VOICE_ID) {
      return res.status(503).json({ error: 'Image avatars require TAVUS_DEFAULT_VOICE_ID. A training video can be used when custom voice training is configured.' })
    }
    body.default_voice_id = process.env.TAVUS_DEFAULT_VOICE_ID
    body.auto_fix_training_image = true
  }

  const provider = await fetch('https://tavusapi.com/v2/faces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TAVUS_API_KEY },
    body: JSON.stringify(body),
  })
  const text = await provider.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }

  if (!provider.ok) return res.status(provider.status).json({ error: 'Tavus identity creation failed.', detail: data })

  const faceId = data.face_id || data.faceId || data.id || null
  const db = await import('@supabase/supabase-js')
  const admin = db.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  await admin.from('media_assets').insert({
    owner_id: user.id,
    kind: 'avatar_source',
    storage_path: sourceUrl,
    provider: 'tavus',
    provider_asset_id: faceId,
    processing_status: 'processing',
    metadata: { sourceType, consentConfirmed: true },
  })
  await admin.from('ai_identities').insert({
    owner_id: user.id,
    name: String(name || 'Spectra Identity').trim().slice(0, 80),
    status: 'processing',
    provider: 'tavus',
    provider_identity_id: faceId,
    metadata: { sourceType, consentConfirmed: true, providerResponse: data },
  })

  return res.status(200).json({ ...data, ownerId: user.id, faceId, voiceFromTrainingVideo: sourceType === 'video' })
}
