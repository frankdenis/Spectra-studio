export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const { name, sourceUrl, sourceType, consent } = req.body || {}

  if (!token) return res.status(401).json({ error: 'Authentication required.' })
  if (!consent) return res.status(400).json({ error: 'Explicit likeness and voice consent is required.' })
  if (!sourceUrl || !['image', 'video'].includes(sourceType)) return res.status(400).json({ error: 'A valid image or video source is required.' })
  if (!process.env.TAVUS_API_KEY) return res.status(503).json({ error: 'Tavus is not configured on the server.' })

  const body = { face_name: String(name || 'Spectra Identity').slice(0, 80), model_name: 'phoenix-4.5' }
  if (sourceType === 'video') body.train_video_url = sourceUrl
  else {
    body.train_image_url = sourceUrl
    body.default_voice_id = process.env.TAVUS_DEFAULT_VOICE_ID
    body.auto_fix_training_image = true
  }

  const provider = await fetch('https://tavusapi.com/v2/faces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TAVUS_API_KEY },
    body: JSON.stringify(body),
  })
  const data = await provider.json()
  return res.status(provider.status).json(data)
}
