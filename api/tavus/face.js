export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const { name, sourceUrl, sourceType, consent } = req.body || {}

  if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return res.status(401).json({ error: 'Authenticated server configuration is required.' })
  if (!consent) return res.status(400).json({ error: 'Explicit likeness and voice consent is required.' })
  if (!sourceUrl || !['image', 'video'].includes(sourceType)) return res.status(400).json({ error: 'A valid image or video source is required.' })
  if (!process.env.TAVUS_API_KEY) return res.status(503).json({ error: 'Tavus is not configured on the server.' })

  const authResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!authResponse.ok) return res.status(401).json({ error: 'Invalid session.' })
  const user = await authResponse.json()

  const adminEmails = (process.env.SPECTRA_ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean)\n  const isAdmin = adminEmails.includes(String(user.email || '').toLowerCase())\n\n  const limitsResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/user_limits?select=unlimited,monthly_avatar_minutes&user_id=eq.${encodeURIComponent(user.id)}`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
  })
  const limits = await limitsResponse.json()
  if (!isAdmin && (!limitsResponse.ok || !limits[0])) return res.status(403).json({ error: 'Usage limits are not configured for this account.' })
  if (!isAdmin && !limits[0].unlimited && Number(limits[0].monthly_avatar_minutes || 0) <= 0) return res.status(402).json({ error: 'Your avatar allowance is exhausted.' })

  const body = { face_name: String(name || 'Spectra Identity').slice(0, 80), model_name: 'phoenix-4.5' }
  if (sourceType === 'video') body.train_video_url = sourceUrl
  else {
    body.train_image_url = sourceUrl
    if (!process.env.TAVUS_DEFAULT_VOICE_ID) return res.status(503).json({ error: 'Image avatars require a configured default voice. Use a training video to create a custom voice from its audio.' })
    body.default_voice_id = process.env.TAVUS_DEFAULT_VOICE_ID
    body.auto_fix_training_image = true
  }

  const provider = await fetch('https://tavusapi.com/v2/faces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TAVUS_API_KEY },
    body: JSON.stringify(body),
  })
  const data = await provider.json()
  return res.status(provider.status).json({ ...data, ownerId: user.id, voiceFromTrainingVideo: sourceType === 'video' })
}
