import { createClient } from '@supabase/supabase-js'

function json(res, status, body) {
  return res.status(status).json(body)
}

function authToken(req) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const token = authToken(req)
  if (!token) return json(res, 401, { error: 'Authentication required.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 503, { error: 'Supabase server configuration is incomplete.' })
  }

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) return json(res, 401, { error: 'Invalid session.' })

  const { generationId, type, inputs = {} } = req.body || {}
  if (!generationId || !['image', 'video', 'image_to_video'].includes(type)) {
    return json(res, 400, { error: 'generationId and a supported generation type are required.' })
  }

  const { data: generation, error: generationError } = await admin
    .from('generations')
    .select('id,owner_id,kind,status,prompt,metadata')
    .eq('id', generationId)
    .eq('owner_id', user.id)
    .single()

  if (generationError || !generation) return json(res, 404, { error: 'Generation job not found.' })

  if (type === 'image') {
    if (!process.env.OPENAI_API_KEY) {
      await admin.from('generations').update({ status: 'blocked', error_message: 'Image provider is not configured on the server.' }).eq('id', generationId)
      return json(res, 503, { error: 'Image generation provider is not configured yet.' })
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt: String(inputs.Prompt || generation.prompt || '').slice(0, 10000),
        size: inputs['Aspect ratio'] === '16:9' ? '1536x1024' : inputs['Aspect ratio'] === '9:16' ? '1024x1536' : '1024x1024',
        quality: inputs.Quality === 'Low' ? 'low' : inputs.Quality === 'Medium' ? 'medium' : 'high',
      }),
    })
    const body = await response.json()
    if (!response.ok) {
      await admin.from('generations').update({ status: 'failed', error_message: JSON.stringify(body).slice(0, 2000) }).eq('id', generationId)
      return json(res, response.status, { error: 'Image provider request failed.', detail: body })
    }

    const image = body.data?.[0]
    if (!image?.b64_json) {
      await admin.from('generations').update({ status: 'failed', error_message: 'Image provider returned no image data.' }).eq('id', generationId)
      return json(res, 502, { error: 'Image provider returned no image data.' })
    }

    const bytes = Buffer.from(image.b64_json, 'base64')
    const path = `${user.id}/generated/${generationId}.png`
    const upload = await admin.storage.from('media-assets').upload(path, bytes, { contentType: 'image/png', upsert: true })
    if (upload.error) {
      await admin.from('generations').update({ status: 'failed', error_message: upload.error.message }).eq('id', generationId)
      return json(res, 500, { error: 'Generated image could not be stored.' })
    }

    const { data: signed } = await admin.storage.from('media-assets').createSignedUrl(path, 86400)
    const asset = await admin.from('media_assets').insert({
      owner_id: user.id,
      kind: 'avatar_output',
      storage_path: path,
      provider: 'openai',
      provider_asset_id: generationId,
      processing_status: 'ready',
      metadata: { generationId, mimeType: 'image/png' },
    }).select('id').single()

    await admin.from('generations').update({
      provider: 'openai',
      provider_job_id: generationId,
      status: 'ready',
      output_asset_ids: asset.data?.id ? [asset.data.id] : [],
      completed_at: new Date().toISOString(),
    }).eq('id', generationId)

    return json(res, 200, { url: signed?.signedUrl || null, generationId, assetId: asset.data?.id || null })
  }

  const providerUrl = process.env.SPECTRA_MEDIA_VIDEO_URL
  const providerKey = process.env.SPECTRA_MEDIA_VIDEO_KEY
  if (!providerUrl || !providerKey) {
    await admin.from('generations').update({ status: 'blocked', error_message: 'Video provider is not configured on the server.' }).eq('id', generationId)
    return json(res, 503, { error: 'Video provider is not configured yet.' })
  }

  const provider = await fetch(providerUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${providerKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, generationId, inputs, userId: user.id }),
  })
  const result = await provider.json().catch(() => ({}))
  if (!provider.ok) {
    await admin.from('generations').update({ status: 'failed', error_message: JSON.stringify(result).slice(0, 2000) }).eq('id', generationId)
    return json(res, provider.status, { error: 'Video provider request failed.', detail: result })
  }

  await admin.from('generations').update({
    provider: result.provider || 'configured-video-provider',
    provider_job_id: result.id || result.jobId || generationId,
    status: result.status || 'processing',
    metadata: { ...(generation.metadata || {}), providerResponse: result },
  }).eq('id', generationId)

  return json(res, 202, { generationId, status: result.status || 'processing', jobId: result.id || result.jobId || generationId, url: result.url || null })
}
