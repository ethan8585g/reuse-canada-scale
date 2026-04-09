import { Hono } from 'hono'
import { authMiddleware, employeeOnly } from '../middleware/auth'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY: string
}

export const junkRemovalRoutes = new Hono<{ Bindings: Bindings }>()

junkRemovalRoutes.use('*', authMiddleware, employeeOnly)

const YARD_ADDRESS  = '13140 24 St NE, Edmonton, Alberta, Canada'
const DUMP_ADDRESS  = '4810 68 Ave NW, Edmonton, Alberta, Canada'  // Core Waste Management

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ReuseCanada-JunkRemoval/1.0 (contact@reusecanada.com)' } })
    const data = await res.json() as any[]
    if (!data?.length) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
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

    if (!jobCoords)  return c.json({ error: `Could not locate address: "${address}". Please be more specific (e.g. include street number and city).` }, 400)
    if (!yardCoords) return c.json({ error: 'Could not locate yard address.' }, 500)
    if (!dumpCoords) return c.json({ error: 'Could not locate dump address.' }, 500)

    // Get all 3 route legs in parallel
    const [leg1, leg2, leg3] = await Promise.all([
      getRoute(yardCoords, jobCoords),   // Yard → Job
      getRoute(jobCoords, dumpCoords),   // Job → Dump (Core Waste)
      getRoute(dumpCoords, yardCoords)   // Dump → Back to Yard
    ])

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
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
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
    return c.json({ error: err.message }, 500)
  }
})
