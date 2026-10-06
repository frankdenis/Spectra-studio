import { createClient } from '@supabase/supabase-js'

const PLAY_HT_USER_ID = process.env.PLAY_HT_USER_ID || process.env.PLAYHT_USER_ID
const PLAY_HT_API_KEY = process.env.PLAY_HT_API_KEY || process.env.PLAYHT_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Authentication required.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Supabase server configuration is incomplete.' })
  if (!PLAY_HT_USER_ID || !PLAY_HT_API_KEY) return res.status(503).json({ error: 'PlayHT provider is not configured yet.' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid session.' })

  const upstream = await fetch('https://api.play.ht/api/v2/voices', {
    headers: { 'X-USER-ID': PLAY_HT_USER_ID, 'AUTHORIZATION': PLAY_HT_API_KEY, accept: 'application/json' },
  })
  const body = await upstream.text()
  res.status(upstream.status).setHeader('Content-Type', 'application/json').end(body)
}
