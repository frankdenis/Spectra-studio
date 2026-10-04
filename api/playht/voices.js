export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'})
  if(!process.env.PLAY_HT_USER_ID||!process.env.PLAY_HT_API_KEY) return res.status(503).json({error:'PlayHT provider is not configured yet.'})
  const upstream=await fetch('https://api.play.ht/api/v2/voices',{headers:{'X-USER-ID':process.env.PLAY_HT_USER_ID,'AUTHORIZATION':process.env.PLAY_HT_API_KEY,'accept':'application/json'}})
  const body=await upstream.text()
  res.status(upstream.status).setHeader('Content-Type','application/json').end(body)
}
