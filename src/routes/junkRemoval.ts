import { Hono } from 'hono'
import { authMiddleware, employeeOnly } from '../middleware/auth'
import { YARD_ADDRESS } from '../utils/yard'

type Bindings = {
  DB: D1Database
  open_ai: string
}

export const junkRemovalRoutes = new Hono<{ Bindings: Bindings }>()

junkRemovalRoutes.use('*', authMiddleware, employeeOnly)

const DUMP_ADDRESS  = '4810 68 Ave NW, Edmonton, Alberta, Canada'  // Core Waste Management

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  // Try progressively broader queries until one resolves
  const attempts = [
    `${address}, Edmonton, Alberta, Canada`,
    `${address}, Alberta, Canada`,
    `${address}, Canada`,
    address
  ]
  for (const query of attempts) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      const res = await fetch(url, { headers: { 'User-Agent': 'ReuseCanada-JunkRemoval/1.0 (contact@reusecanada.com)' } })
      const data = await res.json() as any[]
      if (data?.length) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    } catch { /* try next */ }
  }
  return null
}

async function getRoute(from: { lat: number; lon: number }, to: { lat: number; lon: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ReuseCanada-JunkRemoval/1.0' } })
    const data = await res.json() as any
    if (!data.routes?.length) return null
    return {
      distance_km: Math.round(data.routes[0].distance / 100) / 10,
      duration_min: Math.round(data.routes[0].duration / 60)
    }
  } catch {
    return null
  }
}

// ── Chat endpoint (conversational AI with persistent history) ──────────────
junkRemovalRoutes.post('/chat', async (c) => {
  try {
    const { messages, images } = await c.req.json()
    // messages: [{ role, content, hadImages }]  — images stripped from old turns
    // images: base64 array for the CURRENT (latest) user message

    // Scan full conversation for any address pattern
    const allText = (messages || []).map((m: any) => m.content).join(' ')
    const addressRx = /\d+\s+[\w]+(?:\s+[\w]+){0,4}?\s+(?:Street|St|Avenue|Ave|Drive|Dr|Boulevard|Blvd|Road|Rd|Way|Crescent|Cres|Court|Ct|Place|Pl|Lane|Ln|Circle|Circ|Close|Cl|Wynd|Trail|Grove|Bay|Green|Gate|Link|Park|Heights|Terrace|Tr|NW|NE|SW|SE)(?:\s+(?:NW|NE|SW|SE))?\b/i
    const addressMatch = allText.match(addressRx)

    let routingContext = ''
    let routeData: any = null
    let detectedAddress = addressMatch ? addressMatch[0].trim() : null

    if (addressMatch) {
      const addr = detectedAddress!
      const [yardC, dumpC, jobC] = await Promise.all([
        geocode(YARD_ADDRESS),
        geocode(DUMP_ADDRESS),
        geocode(addr)
      ])
      if (yardC && dumpC && jobC) {
        const [l1, l2, l3] = await Promise.all([
          getRoute(yardC, jobC),
          getRoute(jobC, dumpC),
          getRoute(dumpC, yardC)
        ])
        if (l1 && l2 && l3) {
          routeData = { yard_to_job: l1, job_to_dump: l2, dump_to_yard: l3 }
          const td = l1.duration_min + l2.duration_min + l3.duration_min
          const tk = (l1.distance_km + l2.distance_km + l3.distance_km).toFixed(1)
          routingContext = `
[ROUTING CALCULATED FOR "${addr}"]
• Yard (13140 24 St NE) → Job Site: ${l1.distance_km} km, ${l1.duration_min} min
• Job Site → Core Waste Mgmt (4810 68 Ave NW): ${l2.distance_km} km, ${l2.duration_min} min
• Core Waste → Back to Yard: ${l3.distance_km} km, ${l3.duration_min} min
• TOTAL: ${tk} km, ${td} min driving`
        }
      }
    }

    const systemPrompt = `You are a junk removal estimator for Reuse Canada in Edmonton, Alberta.

MANDATORY PRICING — YOU MUST USE THESE EXACT RATES. DO NOT USE ANY OTHER RATES:
- Labour rate: $150 CAD per hour (covers truck + all crew, for ALL time including driving)
- Dump fee: $95 CAD per tonne
- FORMULA: price = (total_job_time_hours × 150) + (weight_tonnes × 95)
- Low estimate = calculated price × 0.85, High estimate = calculated price × 1.15
- NEVER output a price below what this formula produces. Do not use market rates. Do not guess. Always use $150/hr.

EXAMPLE CALCULATION (follow this exactly):
- 2 hour job, 0.8 tonnes → labour = 2 × $150 = $300, dump = 0.8 × $95 = $76, total = $376
- Low = $376 × 0.85 = $320, High = $376 × 1.15 = $432
- Output: price_estimate_low=320, price_estimate_high=432

WEIGHT GUIDELINES:
- Quarter load (~1 cubic yard): ~0.15–0.25 tonnes
- Half load (~2 cubic yards): ~0.3–0.5 tonnes
- Full load (~4 cubic yards): ~0.6–1.0 tonne
- 1.5 loads: ~1.0–1.5 tonnes
- 2 loads: ~1.5–2.0 tonnes
- Add 0.1–0.3 tonnes per heavy item (appliance, mattress, concrete)

Behaviour:
- Be concise and professional. Ask follow-up questions when needed (floor level, appliances, access, etc.)
- If no photos have been shared yet, ask for them
- If no address has been mentioned yet, ask for it
- Once you have both photos AND an address (or enough description), produce the full quote

${routingContext || 'No address detected in conversation yet. Ask for it if not provided.'}

When you have enough info to quote, write your normal conversational reply THEN append EXACTLY this block at the very end (no extra text after it):
---QUOTE---
{"items_description":"...","volume_estimate":"Quarter Load|Half Load|Full Load|1.5 Loads|2 Loads","weight_tonnes":<number eg 0.4>,"job_time_min":<int>,"crew_size":<int>,"difficulty":"Easy|Medium|Hard","special_notes":"...","price_estimate_low":<int CAD calculated from rates>,"price_estimate_high":<int CAD calculated from rates>,"quote_summary":"one concise paragraph"}
---END_QUOTE---`

    // Build OpenAI messages — only attach images to the latest user turn
    const openaiMsgs: any[] = [{ role: 'system', content: systemPrompt }]
    const history = messages || []

    for (let i = 0; i < history.length; i++) {
      const m = history[i]
      const isLatest = i === history.length - 1
      if (m.role === 'assistant') {
        openaiMsgs.push({ role: 'assistant', content: m.content })
      } else {
        const parts: any[] = []
        if (m.content) parts.push({ type: 'text', text: m.content })
        // Attach images: current turn gets new uploads, older turns skip (GPT already saw them)
        if (isLatest && images?.length) {
          for (const img of images.slice(0, 6)) {
            parts.push({ type: 'image_url', image_url: { url: img, detail: 'high' } })
          }
        } else if (m.hadImages) {
          // Remind GPT images were shared in this turn
          parts.push({ type: 'text', text: `[${m.hadImages} photo(s) were shared in this message and analyzed above]` })
        }
        openaiMsgs.push({ role: 'user', content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts })
      }
    }

    const oaRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${c.env.open_ai}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: openaiMsgs, max_tokens: 1400 })
    })
    if (!oaRes.ok) return c.json({ error: `OpenAI error: ${oaRes.status}` }, 500)

    const oaData = await oaRes.json() as any
    const full: string = oaData.choices[0].message.content || ''

    const quoteMatch = full.match(/---QUOTE---\s*([\s\S]*?)\s*---END_QUOTE---/)
    let quoteData: any = null
    const reply = full.replace(/---QUOTE---[\s\S]*?---END_QUOTE---/, '').trim()

    if (quoteMatch) {
      try {
        quoteData = JSON.parse(quoteMatch[1].trim())
        quoteData.address = detectedAddress || 'Unknown address'
        if (routeData) {
          const driveMin = routeData.yard_to_job.duration_min + routeData.job_to_dump.duration_min + routeData.dump_to_yard.duration_min
          const jobMin = quoteData.job_time_min || 60
          const totalMin = driveMin + jobMin
          quoteData.route = routeData
          quoteData.summary = {
            drive_time_min: driveMin,
            job_time_min: jobMin,
            total_time_min: totalMin,
            total_time_label: totalMin >= 60 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `${totalMin}m`
          }
        }
      } catch { /* malformed JSON — skip quote card */ }
    }

    return c.json({ reply, quoteData })
  } catch (err: any) {
    console.error('junkRemoval error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

junkRemovalRoutes.post('/quote', async (c) => {
  try {
    const { address, images, notes } = await c.req.json()
    if (!address?.trim()) return c.json({ error: 'Job address is required' }, 400)

    // Geocode job address + fixed addresses in parallel
    const jobQuery = address.includes('Edmonton') || address.includes('AB')
      ? address
      : `${address}, Edmonton, Alberta, Canada`

    const [yardCoords, dumpCoords, jobCoords] = await Promise.all([
      geocode(YARD_ADDRESS),
      geocode(DUMP_ADDRESS),
      geocode(jobQuery)
    ])

    // Route legs — only calculate if all coords resolved, otherwise proceed without routing
    let leg1 = null, leg2 = null, leg3 = null
    if (jobCoords && yardCoords && dumpCoords) {
      ;[leg1, leg2, leg3] = await Promise.all([
        getRoute(yardCoords, jobCoords),
        getRoute(jobCoords, dumpCoords),
        getRoute(dumpCoords, yardCoords)
      ])
    }

    // Build image messages for GPT-4o (max 6 images)
    const imageMessages = (images || []).slice(0, 6).map((img: string) => ({
      type: 'image_url',
      image_url: { url: img, detail: 'high' }
    }))

    const hasImages = imageMessages.length > 0
    const notesText = notes?.trim() ? `\n\nAdditional notes from customer: ${notes}` : ''

    const userContent: any[] = [
      {
        type: 'text',
        text: `You are estimating a junk removal job in Edmonton, Alberta for Reuse Canada Junk Removal.

Job address: ${address}${notesText}
${hasImages ? `${imageMessages.length} photo(s) uploaded of the job site.` : 'No photos uploaded — estimate based on address/notes only.'}

Respond with ONLY a valid JSON object (no markdown, no explanation) in this exact structure:
{
  "items_description": "Detailed description of junk items visible / reported",
  "volume_estimate": "Quarter Load | Half Load | Full Load | 1.5 Loads | 2 Loads",
  "job_time_min": <integer minutes for just the junk removal work, not driving>,
  "crew_size": <integer 1-3>,
  "difficulty": "Easy | Medium | Hard",
  "special_notes": "Hazardous items, heavy items, access issues, or 'None'",
  "price_estimate_low": <integer CAD, just number>,
  "price_estimate_high": <integer CAD, just number>,
  "quote_summary": "One paragraph professional quote summary for the customer"
}`
      },
      ...imageMessages
    ]

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.open_ai}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional junk removal estimator. Analyze job site photos and provide accurate, conservative estimates. Always respond with valid JSON only.'
          },
          { role: 'user', content: userContent }
        ],
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      return c.json({ error: `OpenAI error: ${openaiRes.status} — ${err}` }, 500)
    }

    const openaiData = await openaiRes.json() as any
    let ai: any = {}
    try {
      ai = JSON.parse(openaiData.choices[0].message.content)
    } catch {
      ai = { items_description: openaiData.choices[0]?.message?.content || 'Analysis unavailable' }
    }

    const totalDriveMin    = (leg1?.duration_min || 0) + (leg2?.duration_min || 0) + (leg3?.duration_min || 0)
    const totalDistanceKm  = (leg1?.distance_km || 0) + (leg2?.distance_km || 0) + (leg3?.distance_km || 0)
    const jobMin           = ai.job_time_min || 60
    const totalMin         = totalDriveMin + jobMin

    return c.json({
      address,
      route: {
        yard_to_job:       { ...leg1, label: 'Yard → Job Site' },
        job_to_dump:       { ...leg2, label: 'Job Site → Core Waste' },
        dump_to_yard:      { ...leg3, label: 'Core Waste → Yard' },
        total_distance_km: Math.round(totalDistanceKm * 10) / 10,
        total_drive_min:   totalDriveMin
      },
      ai,
      summary: {
        drive_time_min:   totalDriveMin,
        job_time_min:     jobMin,
        total_time_min:   totalMin,
        total_time_label: totalMin >= 60
          ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
          : `${totalMin}m`
      }
    })
  } catch (err: any) {
    console.error('junkRemoval error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Save a completed quote to history ─────────────────────────────────────
junkRemovalRoutes.post('/save-quote', async (c) => {
  try {
    const q = await c.req.json()
    const r = q.route
    const s = q.summary
    const totalKm = r
      ? Math.round(((r.yard_to_job?.distance_km || 0) + (r.job_to_dump?.distance_km || 0) + (r.dump_to_yard?.distance_km || 0)) * 10) / 10
      : null

    await c.env.DB.prepare(`
      INSERT INTO junk_removal_quotes (
        address, items_description, volume_estimate, weight_tonnes,
        job_time_min, crew_size, difficulty, special_notes,
        price_estimate_low, price_estimate_high, quote_summary,
        route_yard_to_job_km, route_yard_to_job_min,
        route_job_to_dump_km, route_job_to_dump_min,
        route_dump_to_yard_km, route_dump_to_yard_min,
        total_distance_km, total_drive_min, total_time_label,
        employee_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      q.address || '',
      q.items_description || null,
      q.volume_estimate || null,
      q.weight_tonnes || null,
      q.job_time_min || null,
      q.crew_size || null,
      q.difficulty || null,
      q.special_notes || null,
      q.price_estimate_low || null,
      q.price_estimate_high || null,
      q.quote_summary || null,
      r?.yard_to_job?.distance_km || null,
      r?.yard_to_job?.duration_min || null,
      r?.job_to_dump?.distance_km || null,
      r?.job_to_dump?.duration_min || null,
      r?.dump_to_yard?.distance_km || null,
      r?.dump_to_yard?.duration_min || null,
      totalKm,
      s?.drive_time_min || null,
      s?.total_time_label || null,
      c.get('userId') || null
    ).run()

    return c.json({ success: true })
  } catch (err: any) {
    console.error('junkRemoval error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Get quote history ──────────────────────────────────────────────────────
junkRemovalRoutes.get('/history', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, address, volume_estimate, difficulty,
             price_estimate_low, price_estimate_high,
             total_distance_km, total_drive_min, total_time_label,
             crew_size, weight_tonnes, items_description, quote_summary,
             route_yard_to_job_km, route_yard_to_job_min,
             route_job_to_dump_km, route_job_to_dump_min,
             route_dump_to_yard_km, route_dump_to_yard_min,
             special_notes, job_time_min,
             created_at
      FROM junk_removal_quotes
      ORDER BY created_at DESC
      LIMIT 100
    `).all()
    return c.json({ quotes: results })
  } catch (err: any) {
    console.error('junkRemoval error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
