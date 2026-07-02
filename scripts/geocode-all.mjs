/**
 * Script para geocodificar todos os missionários sem coordenadas.
 * Usa o nome da missão como fonte primária, cidade como exceção, país como fallback.
 * Respeita o limite de 1 req/s do Nominatim.
 *
 * Rodar: node scripts/geocode-all.mjs
 */

const SUPABASE_URL = 'https://ktlvqmaacsaqffyyiujz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bHZxbWFhY3NhcWZmeXlpdWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzcyNTcsImV4cCI6MjA5NjYxMzI1N30.eHNhw_VwoZgWNY_3e2Rq7Zv9mBZWMXeCnCtxXeBxPUM'

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function geocodeQuery(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'nossos-missionarios-geocoder/1.0' } })
  const data = await res.json()
  if (data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

async function resolveCoords(m) {
  if (m.cidade_missao && m.pais_missao) {
    return geocodeQuery(`${m.cidade_missao}, ${m.pais_missao}`)
  }
  if (m.nome_missao) {
    return geocodeQuery(m.nome_missao)
  }
  if (m.pais_missao) {
    return geocodeQuery(m.pais_missao)
  }
  return null
}

async function fetchMissionaries() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/missionaries?select=id,nome,nome_missao,cidade_missao,pais_missao,latitude,longitude`, { headers })
  return res.json()
}

async function updateCoords(id, lat, lng) {
  await fetch(`${SUPABASE_URL}/rest/v1/missionaries?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ latitude: lat, longitude: lng }),
  })
}

async function main() {
  console.log('Buscando missionários...')
  const missionaries = await fetchMissionaries()
  console.log(`Total encontrado: ${missionaries.length}\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const m of missionaries) {
    const alreadyHas = m.latitude != null && m.longitude != null
    const hasSource = m.nome_missao || m.cidade_missao || m.pais_missao

    if (!hasSource) {
      console.log(`⚠  ${m.nome} — sem dados de localização, pulando`)
      skipped++
      continue
    }

    const query = m.cidade_missao && m.pais_missao
      ? `${m.cidade_missao}, ${m.pais_missao}`
      : m.nome_missao || m.pais_missao

    process.stdout.write(`📍 ${m.nome} (${query})${alreadyHas ? ' [já tinha coords]' : ''}... `)

    await sleep(1100) // respeita limite do Nominatim (1 req/s)

    const coords = await resolveCoords(m)
    if (!coords) {
      console.log('❌ não encontrado')
      failed++
      continue
    }

    await updateCoords(m.id, coords.lat, coords.lng)
    console.log(`✓ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`)
    updated++
  }

  console.log(`\nConcluído: ${updated} atualizados, ${skipped} pulados, ${failed} não encontrados`)
}

main().catch(console.error)
