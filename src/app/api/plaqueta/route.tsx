import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCountryAlpha2, getAlpha2FromNumericId } from '@/lib/countryNames'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { Resvg } from '@resvg/resvg-js'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { feature: topoFeature } = require('topojson-client')

export const dynamic = 'force-dynamic'

// ── Dimensões ────────────────────────────────────────────────────────────────
const W = 390, H = 540

// ── Posições calibradas ──────────────────────────────────────────────────────
const PHOTO_L = 36,  PHOTO_T = 43,  PHOTO_W = 151, PHOTO_H = 274
const MN_T    = 80
const NAME_L  = PHOTO_L, NAME_T  = 333
const MAP_L   = 208, MAP_T   = 329, MAP_W   = 151, MAP_H   = 138
const FLAG_T  = 475
const FT_Y    = 502, ALA_L   = 32,  DATE_L  = 197

// ── Helpers ──────────────────────────────────────────────────────────────────
function normalize(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

function buildMissaoNome(pais: string | null, nome: string | null): string {
  const p = pais ?? '', n = nome ?? ''
  if (!p && !n) return ''
  if (!n) return p
  if (!p) return n
  if (normalize(n).startsWith(normalize(p))) return n
  return `${p} ${n}`
}

function toB64(buf: Buffer | ArrayBuffer, mime: string) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
  return `data:${mime};base64,${b.toString('base64')}`
}

// ── Mapa do Brasil ────────────────────────────────────────────────────────────
const BRAZIL_BOUNDS = { minLon: -73.99, maxLon: -28.85, minLat: -33.75, maxLat: 5.27 }

function mercY(lat: number) {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
}

function projectBrazil(lon: number, lat: number, w: number, h: number): [number, number] {
  const { minLon, maxLon, minLat, maxLat } = BRAZIL_BOUNDS
  const minMY = mercY(minLat), maxMY = mercY(maxLat)
  return [
    ((lon - minLon) / (maxLon - minLon)) * w,
    (1 - (mercY(lat) - minMY) / (maxMY - minMY)) * h,
  ]
}

// Gera SVG string do Brasil (para usar como img src data URL no satori)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function brazilToSvg(geoJson: any, w: number, h: number, markerXY?: [number, number]): string {
  let pathsStr = ''
  for (const feature of geoJson.features ?? []) {
    const { type, coordinates } = feature.geometry
    const rings: number[][][] =
      type === 'Polygon'      ? coordinates :
      type === 'MultiPolygon' ? coordinates.flat(1) : []
    for (const ring of rings) {
      const d = ring.map(([lon, lat]: number[], i: number) => {
        const [x, y] = projectBrazil(lon, lat, w, h)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ') + ' Z'
      pathsStr += `<path d="${d}" fill="#e8e8e8" stroke="#777" stroke-width="0.6"/>`
    }
  }
  let markerStr = ''
  if (markerXY) {
    const [mx, my] = markerXY
    markerStr = `
      <ellipse cx="${mx}" cy="${my+5}" rx="3" ry="1.5" fill="rgba(0,0,0,0.25)"/>
      <path d="M${mx} ${my-8}C${mx-2.1} ${my-8} ${mx-3.8} ${my-6.2} ${mx-3.8} ${my-4}c0 2.9 3.8 8 3.8 8s3.8-5.1 3.8-8c0-2.2-1.7-4-3.8-4z" fill="#1a56db"/>
      <circle cx="${mx}" cy="${my-4}" r="1.7" fill="white"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="white"/>${pathsStr}${markerStr}</svg>`
}

// ── Mapa Mundial ──────────────────────────────────────────────────────────────
function mercYGen(lat: number) {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
}

// Gera SVG string de um país do mundo (para usar como img src data URL no satori)
function worldCountrySvg(
  targetAlpha2: string,
  w: number, h: number,
  markerLon?: number, markerLat?: number,
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topology: any = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'node_modules', 'world-atlas', 'countries-110m.json'),
      'utf-8',
    )
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countries = topoFeature(topology, topology.objects.countries) as any

  const target = targetAlpha2.toLowerCase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countryFeat = countries.features.find((f: any) =>
    getAlpha2FromNumericId(f.id) === target
  )

  if (!countryFeat) return ''

  const allCoords: number[][] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function collectCoords(geom: any) {
    if (geom.type === 'Polygon') geom.coordinates.flat(1).forEach((c: number[]) => allCoords.push(c))
    else if (geom.type === 'MultiPolygon') geom.coordinates.flat(2).forEach((c: number[]) => allCoords.push(c))
  }
  collectCoords(countryFeat.geometry)
  if (!allCoords.length) return ''

  const lons = allCoords.map(c => c[0])
  const lats = allCoords.map(c => c[1])
  const pad  = 0.15
  const lonRange = Math.max(...lons) - Math.min(...lons)
  const latRange = Math.max(...lats) - Math.min(...lats)
  const minLon = Math.min(...lons) - lonRange * pad
  const maxLon = Math.max(...lons) + lonRange * pad
  const minLat = Math.min(...lats) - latRange * pad
  const maxLat = Math.max(...lats) + latRange * pad

  const minMY = mercYGen(minLat), maxMY = mercYGen(maxLat)
  function proj(lon: number, lat: number): [number, number] {
    return [
      ((lon - minLon) / (maxLon - minLon)) * w,
      (1 - (mercYGen(lat) - minMY) / (maxMY - minMY)) * h,
    ]
  }

  const geom = countryFeat.geometry
  const rings: number[][][] =
    geom.type === 'Polygon'      ? geom.coordinates :
    geom.type === 'MultiPolygon' ? geom.coordinates.flat(1) : []

  let pathsStr = ''
  for (const ring of rings) {
    const d = ring.map((c: number[], i: number) => {
      const [x, y] = proj(c[0], c[1])
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ') + ' Z'
    pathsStr += `<path d="${d}" fill="#e8e8e8" stroke="#777" stroke-width="0.6"/>`
  }

  let markerStr = ''
  if (markerLon != null && markerLat != null) {
    const [mx, my] = proj(markerLon, markerLat)
    markerStr = `
      <ellipse cx="${mx}" cy="${my+5}" rx="3" ry="1.5" fill="rgba(0,0,0,0.25)"/>
      <path d="M${mx} ${my-8}C${mx-2.1} ${my-8} ${mx-3.8} ${my-6.2} ${mx-3.8} ${my-4}c0 2.9 3.8 8 3.8 8s3.8-5.1 3.8-8c0-2.2-1.7-4-3.8-4z" fill="#1a56db"/>
      <circle cx="${mx}" cy="${my-4}" r="1.7" fill="white"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="white"/>${pathsStr}${markerStr}</svg>`
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // Dados padrão (mock)
  let nome     = 'Beatriz Silva Cavalcante'
  let titulo: string | null = 'Sister'
  let missao   = 'Brasil Salvador'
  let ala      = 'Jardim Helena'
  let inicio   = '10/02/2025'
  let termino  = '22/07/2026'
  let fotoUrl: string | null = null
  let lat: number | null = -12.9714
  let lon: number | null = -38.5014
  let alpha2: string | null = 'br'
  let isBrazil = true

  if (id) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: m, error } = await supabase
      .from('missionaries')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !m) {
      return new Response(JSON.stringify({ error: 'Não encontrado' }), { status: 404 })
    }

    nome     = m.nome
    titulo   = m.genero === 'F' ? 'Sister' : m.genero === 'M' ? 'Elder' : null
    missao   = buildMissaoNome(m.pais_missao, m.nome_missao)
    ala      = m.ala ?? ''
    inicio   = formatDate(m.data_inicio)
    termino  = formatDate(m.data_termino)
    fotoUrl  = m.foto_url ?? null
    lat      = m.latitude ?? null
    lon      = m.longitude ?? null
    alpha2   = getCountryAlpha2(m.pais_missao)
    isBrazil = normalize(m.pais_missao ?? '') === 'brasil'
  }

  // ── Template (leitura direta do disco) ──
  const templateBuf = fs.readFileSync(path.join(process.cwd(), 'public', 'template-plaqueta.jpg'))
  const templateB64 = toB64(templateBuf, 'image/jpeg')

  // ── Mapa (SVG → PNG via sharp → base64 → img src) ──
  let mapB64: string | null = null

  if (isBrazil) {
    try {
      const statesJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'brazil-states.json'), 'utf-8'))
      const markerXY = (lon != null && lat != null) ? projectBrazil(lon, lat, MAP_W, MAP_H) : undefined
      const svg = brazilToSvg(statesJson, MAP_W, MAP_H, markerXY)
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: MAP_W } }).render().asPng()
      mapB64 = toB64(png, 'image/png')
    } catch { /* sem mapa */ }
  } else if (alpha2) {
    try {
      const svg = worldCountrySvg(alpha2, MAP_W, MAP_H,
        lon != null ? lon : undefined,
        lat != null ? lat : undefined,
      )
      if (svg) {
        const png = new Resvg(svg, { fitTo: { mode: 'width', value: MAP_W } }).render().asPng()
        mapB64 = toB64(png, 'image/png')
      }
    } catch { /* sem mapa */ }
  }

  // ── Bandeira ──
  let flagB64: string | null = null
  if (alpha2) {
    try {
      const res = await fetch(`https://flagcdn.com/w80/${alpha2}.png`)
      if (res.ok) {
        const mime = res.headers.get('content-type') || 'image/png'
        flagB64 = toB64(await res.arrayBuffer(), mime)
      }
    } catch { /* sem bandeira */ }
  }

  // ── Foto do missionário (converte WebP → JPEG para o satori) ──
  let fotoB64: string | null = null
  if (fotoUrl) {
    try {
      const res = await fetch(fotoUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const jpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer()
        fotoB64 = toB64(jpeg, 'image/jpeg')
      }
    } catch { /* sem foto */ }
  }

  const nameWidth = PHOTO_W

  return new ImageResponse(
    (
      <div style={{ position: 'relative', width: W, height: H, display: 'flex' }}>

        {/* Template */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={templateB64} width={W} height={H}
          style={{ position: 'absolute', top: 0, left: 0 }} />

        {/* ── Foto ── */}
        <div style={{
          position: 'absolute', left: PHOTO_L, top: PHOTO_T,
          width: PHOTO_W, height: PHOTO_H,
          display: 'flex', overflow: 'hidden',
        }}>
          {fotoB64
            ? <img src={fotoB64} width={PHOTO_W} height={PHOTO_H} // eslint-disable-line @next/next/no-img-element
                style={{ objectFit: 'cover', objectPosition: 'top' }} />
            : <div style={{
                width: '100%', height: '100%', background: '#e0e0e0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: '#999',
              }}>SEM FOTO</div>
          }
        </div>

        {/* ── Nome da missão ── */}
        {missao && (
          <div style={{
            position: 'absolute', top: MN_T, left: 192,
            width: W - 192 - 4,
            display: 'flex', justifyContent: 'center',
            fontFamily: 'Georgia, serif',
            fontSize: missao.length <= 16 ? 15 : missao.length <= 22 ? 13 : missao.length <= 28 ? 11 : 9,
            fontWeight: 700, color: '#111',
          }}>
            {missao}
          </div>
        )}

        {/* ── Sister/Elder + Nome ── */}
        <div style={{
          position: 'absolute', left: NAME_L, top: NAME_T,
          width: nameWidth,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {titulo && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#111',
              textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center',
            }}>
              {titulo}
            </span>
          )}
          <span style={{
            fontSize: 16, fontWeight: 700, color: '#111',
            lineHeight: 1.2, marginTop: 2, textAlign: 'center',
          }}>
            {nome}
          </span>
        </div>

        {/* ── Mapa (SVG via img src data URL) ── */}
        {mapB64 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mapB64} width={MAP_W} height={MAP_H}
            style={{ position: 'absolute', left: MAP_L, top: MAP_T }} />
        )}

        {/* ── Bandeira ── */}
        {flagB64 && (
          <div style={{
            position: 'absolute', left: MAP_L, top: FLAG_T,
            width: MAP_W, display: 'flex', justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagB64} height={20} style={{ border: '1px solid #bbb' }} />
          </div>
        )}

        {/* ── Ala ── */}
        <span style={{
          position: 'absolute', left: ALA_L, top: FT_Y,
          fontSize: 12, color: '#111',
        }}>
          {ala}
        </span>

        {/* ── Datas ── */}
        <span style={{
          position: 'absolute', left: DATE_L, top: FT_Y,
          fontSize: 12, color: '#111',
        }}>
          {inicio} - {termino}
        </span>

      </div>
    ),
    { width: W, height: H },
  )
}
