/**
 * Shared visitor counter proxy.
 * Hits https://abacus.jasoncameron.dev once per browser session.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const hit =
    typeof req.query.hit === 'string'
      ? req.query.hit === '1'
      : Array.isArray(req.query.hit)
        ? req.query.hit[0] === '1'
        : false

  const endpoint = hit ? 'hit' : 'get'
  const url = `https://abacus.jasoncameron.dev/${endpoint}/swaraj-portfolio/visits`

  try {
    const upstream = await fetch(url, { cache: 'no-store' })
    if (!upstream.ok) {
      res.status(502).json({ error: 'Counter unavailable' })
      return
    }

    const data = /** @type {{ value?: number }} */ (await upstream.json())
    const count = Number(data.value)
    if (!Number.isFinite(count) || count < 0) {
      res.status(502).json({ error: 'Invalid counter response' })
      return
    }

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ count })
  } catch {
    res.status(502).json({ error: 'Counter unavailable' })
  }
}
