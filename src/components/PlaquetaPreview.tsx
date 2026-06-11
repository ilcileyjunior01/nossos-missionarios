'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Printer, UserCircle } from 'lucide-react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { Missionary } from '@/types/missionary'
import { getCountryName } from '@/lib/countryNames'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Altere aqui o nome da estaca
const NOME_ESTACA_PADRAO = 'ESTACA SP BR TABOÃO'

// Dimensões da plaqueta em tela (18:13 cm → 540 × 390 px)
const W = 540
const H = Math.round(W * (13 / 18)) // 390

// Dimensões internas do mapa SVG calculadas a partir do layout:
//   W(540) - outer pad(28) - inner pad(28) - foto(215) - gap(14) = 255
//   H(390) - outer pad(28) - inner pad(20) - header(~28) - text(~96) - gap(8) = ~210
const MAP_W = 255
const MAP_H = 210

interface Props {
  missionary: Missionary
  nomeEstaca?: string
  onClose: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

function normalize(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

type Coord = number[]
type Geometry = { type: string; coordinates: unknown }

function getGeoBbox(geometry: Geometry): [[number, number], [number, number]] | null {
  let coords: Coord[] = []
  if (geometry.type === 'Polygon') {
    // Só o anel externo
    coords = (geometry.coordinates as Coord[][])[0]
  } else if (geometry.type === 'MultiPolygon') {
    // Usa o anel externo do maior polígono (mais pontos = território principal)
    // Isso evita que Alasca/Havaí distorçam o bbox dos EUA, por exemplo
    const rings = (geometry.coordinates as Coord[][][]).map((polygon) => polygon[0])
    coords = rings.reduce((a, b) => (a.length >= b.length ? a : b))
  }
  if (!coords.length) return null
  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]]
}

function PlaqueBorder({ w, h }: { w: number; h: number }) {
  const g = '#a07828'
  // Outer frame: inset 1px
  const o = { x: 1.5, y: 1.5, w: w - 3, h: h - 3, rx: 9 }
  // Inner frame: inset 10px
  const i = { x: 10, y: 10, w: w - 20, h: h - 20, rx: 5 }
  // Corner arm length along inner frame
  const arm = 22
  // Diamond helper
  const diamond = (cx: number, cy: number, s: number) =>
    `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`

  // Corners of inner frame [x, y, sign-x, sign-y]
  const corners: [number, number, number, number][] = [
    [i.x, i.y, 1, 1],
    [i.x + i.w, i.y, -1, 1],
    [i.x + i.w, i.y + i.h, -1, -1],
    [i.x, i.y + i.h, 1, -1],
  ]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 10 }}
    >
      <defs>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#d4a843" />
          <stop offset="40%"  stopColor="#a07828" />
          <stop offset="100%" stopColor="#c9991f" />
        </linearGradient>
      </defs>

      {/* Outer frame — gradiente dourado */}
      <rect x={o.x} y={o.y} width={o.w} height={o.h} rx={o.rx}
        stroke="url(#borderGrad)" strokeWidth="2.5" fill="none" />

      {/* Second outer line — very thin, inset 5px */}
      <rect x="5" y="5" width={w - 10} height={h - 10} rx="7"
        stroke={g} strokeWidth="0.6" fill="none" opacity="0.45" />

      {/* Inner frame */}
      <rect x={i.x} y={i.y} width={i.w} height={i.h} rx={i.rx}
        stroke={g} strokeWidth="0.9" fill="none" opacity="0.55" />

      {/* Corner ornaments: L-bracket + filled diamond */}
      {corners.map(([cx, cy, sx, sy], idx) => (
        <g key={idx}>
          {/* Horizontal arm */}
          <line x1={cx} y1={cy} x2={cx + sx * arm} y2={cy}
            stroke={g} strokeWidth="1.2" />
          {/* Vertical arm */}
          <line x1={cx} y1={cy} x2={cx} y2={cy + sy * arm}
            stroke={g} strokeWidth="1.2" />
          {/* Diamond at corner */}
          <polygon points={diamond(cx, cy, 4.5)} fill="url(#borderGrad)" />
          {/* Small dot at arm tips */}
          <circle cx={cx + sx * arm} cy={cy} r="1.5" fill={g} opacity="0.7" />
          <circle cx={cx} cy={cy + sy * arm} r="1.5" fill={g} opacity="0.7" />
        </g>
      ))}

      {/* ── Símbolos LDS nos centros de cada lado ── */}

      {/* Templo de SP — centro superior */}
      <g transform={`translate(${i.x + i.w / 2}, ${i.y})`} fill={g} opacity="0.78">
        {/* Figura no topo */}
        <circle cx={0} cy={-17} r={1.5} />
        {/* Espira esbelta */}
        <path d="M0,-17 L-2,-6 L2,-6 Z" />
        {/* Torre: topo escalonado */}
        <rect x={-3} y={-6} width={6} height={2.5} />
        <rect x={-4.5} y={-3.5} width={9} height={2} />
        {/* Torre: corpo */}
        <rect x={-4.5} y={-1.5} width={9} height={9} />
        {/* Portal arqueado central */}
        <rect x={-2} y={1} width={4} height={6.5} fill="#e8d5a0" opacity={0.4} />
        {/* Alas baixas */}
        <rect x={-14} y={4} width={9.5} height={3.5} />
        <rect x={4.5} y={4} width={9.5} height={3.5} />
        {/* Base */}
        <rect x={-14} y={7.5} width={28} height={2} />
        <rect x={-12} y={9.5} width={24} height={1.5} />
      </g>

      {/* Escrituras abertas — centro inferior */}
      <g transform={`translate(${i.x + i.w / 2}, ${i.y + i.h})`} opacity="0.75" stroke={g} fill="none">
        <path d="M0,-5 L-16,-12 L-16,7 L0,7 Z" strokeWidth={1.4} />
        <path d="M0,-5 L16,-12 L16,7 L0,7 Z" strokeWidth={1.4} />
        <line x1={0} y1={-12} x2={0} y2={7} strokeWidth={2} />
      </g>

      {/* Templo de SP — centros laterais */}
      {([[i.x, i.y + i.h / 2], [i.x + i.w, i.y + i.h / 2]] as [number, number][]).map(([cx, cy], idx) => (
        <g key={`temple-${idx}`} transform={`translate(${cx}, ${cy})`} fill={g} opacity="0.72">
          {/* Figura no topo */}
          <circle cx={0} cy={-18} r={1.2} />
          {/* Espira esbelta */}
          <path d="M0,-18 L-1.8,-8 L1.8,-8 Z" />
          {/* Torre escalonada */}
          <rect x={-2.5} y={-8} width={5} height={2.5} />
          <rect x={-3.5} y={-5.5} width={7} height={2} />
          {/* Torre corpo */}
          <rect x={-3.5} y={-3.5} width={7} height={7} />
          {/* Portal */}
          <rect x={-1.5} y={-1.5} width={3} height={5} fill="#e8d5a0" opacity={0.4} />
          {/* Alas baixas */}
          <rect x={-10} y={0} width={6.5} height={3.5} />
          <rect x={3.5} y={0} width={6.5} height={3.5} />
          {/* Base */}
          <rect x={-10} y={3.5} width={20} height={2} />
          <rect x={-8} y={5.5} width={16} height={1.5} />
        </g>
      ))}
    </svg>
  )
}

export default function PlaquetaPreview({ missionary, nomeEstaca = NOME_ESTACA_PADRAO, onClose }: Props) {
  const titulo = missionary.genero === 'F' ? 'Sister' : missionary.genero === 'M' ? 'Elder' : null
  const hasCoords = missionary.latitude != null && missionary.longitude != null
  const coords: [number, number] = hasCoords ? [missionary.longitude!, missionary.latitude!] : [0, 0]
  const normalizedCountry = missionary.pais_missao ? normalize(missionary.pais_missao) : null

  // Inicia centrado nas coords (ou em [0,0] se não houver) — será ajustado via fitCountry
  const [projCenter, setProjCenter] = useState<[number, number]>(hasCoords ? coords : [0, 0])
  const [projScale, setProjScale] = useState(200)
  const fittedRef = useRef(false)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">

      {/* Controles */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#b8972a] hover:bg-[#9f7f1f] text-white rounded-full px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors"
        >
          <Printer size={15} />
          Imprimir
        </button>
        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* ══════════════ PLAQUETA 18 × 13 cm ══════════════ */}
      <div
        id="plaqueta-missionaria"
        style={{
          width: W, height: H,
          borderRadius: 10,
          position: 'relative',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
          padding: 14,
          boxSizing: 'border-box',
          background: `
            repeating-linear-gradient(91deg, transparent, transparent 6px, rgba(160,120,40,0.04) 6px, rgba(160,120,40,0.04) 12px),
            repeating-linear-gradient(180deg, transparent, transparent 30px, rgba(140,100,30,0.03) 30px, rgba(140,100,30,0.03) 60px),
            linear-gradient(168deg, #ede0c4 0%, #e2d0aa 40%, #e8d8b8 70%, #ddd0a8 100%)
          `,
        }}
      >
        {/* ── Borda decorativa SVG ── */}
        <PlaqueBorder w={W} h={H} />

        {/* Moldura interna */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 6,
          padding: '10px 14px',
          boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 8, flexShrink: 0 }}>
            <p style={{
              color: '#3a1c08', fontSize: 8.5, letterSpacing: '0.26em',
              textTransform: 'uppercase', fontFamily: 'var(--font-inter)',
              fontWeight: 600, textAlign: 'center', marginBottom: 6,
            }}>
              {nomeEstaca}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #a07828, transparent)' }} />
              <span style={{ color: '#a07828', fontSize: 8, lineHeight: 1 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #a07828, transparent)' }} />
            </div>
          </div>

          {/* Corpo: foto | informações + mapa */}
          <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>

            {/* Foto */}
            <div style={{
              flexShrink: 0, width: 215,
              borderRadius: 4, overflow: 'hidden',
              border: '2px solid #a07828',
              boxShadow: '0 0 0 1px rgba(140,100,30,0.2), 0 3px 10px rgba(0,0,0,0.2)',
              position: 'relative', background: '#d4c8a8',
            }}>
              {missionary.foto_url ? (
                <Image src={missionary.foto_url} alt={missionary.nome} fill
                  className="object-cover object-top" sizes="215px" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCircle size={52} color="#a07828" />
                </div>
              )}
            </div>

            {/* Coluna direita: texto + mapa */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, minHeight: 0 }}>

              {/* Texto */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ marginBottom: 8 }}>
                  {titulo && (
                    <p style={{
                      color: '#7a5010', fontSize: 9, letterSpacing: '0.2em',
                      textTransform: 'uppercase', fontFamily: 'var(--font-inter)',
                      fontWeight: 600, marginBottom: 2,
                    }}>
                      {titulo}
                    </p>
                  )}
                  <p style={{
                    color: '#2a1206', fontSize: 18,
                    fontFamily: 'var(--font-playfair)', fontWeight: 700, lineHeight: 1.2,
                  }}>
                    {missionary.nome}
                  </p>
                  {missionary.ala && (
                    <p style={{
                      color: '#7a5010', fontSize: 8.5, letterSpacing: '0.14em',
                      textTransform: 'uppercase', fontFamily: 'var(--font-inter)',
                      fontWeight: 500, marginTop: 4,
                    }}>
                      {missionary.ala.toLowerCase().startsWith('ala') ? missionary.ala : `Ala ${missionary.ala}`}
                    </p>
                  )}
                </div>

                <div style={{ height: 1, background: 'rgba(140,100,30,0.35)', marginBottom: 8 }} />

                {(missionary.pais_missao || missionary.nome_missao) && (
                  <p style={{
                    color: '#3a1c08', fontSize: 12, letterSpacing: '0.08em',
                    fontFamily: 'var(--font-inter)', fontWeight: 600,
                    marginBottom: 6, lineHeight: 1.4,
                  }}>
                    Missão
                    {missionary.pais_missao && ` ${missionary.pais_missao}`}
                    {missionary.nome_missao && ` ${missionary.nome_missao}`}
                  </p>
                )}

                <p style={{
                  color: '#4a2c10', fontSize: 10,
                  fontFamily: 'var(--font-inter)', letterSpacing: '0.1em',
                }}>
                  {formatDate(missionary.data_inicio)}
                  <span style={{ color: '#a07828', margin: '0 5px' }}>—</span>
                  {formatDate(missionary.data_termino)}
                </p>
              </div>

              {/* Mapa: transparente, só bordas + pin */}
              {(hasCoords || normalizedCountry) && (
                <div style={{
                  flex: 1, minHeight: 80,
                  borderRadius: 4, overflow: 'hidden',
                  border: '2px solid #a07828',
                  boxShadow: `
                    inset 2px 2px 4px rgba(0,0,0,0.35),
                    inset -1px -1px 3px rgba(255,245,190,0.5),
                    2px 2px 5px rgba(0,0,0,0.3),
                    -1px -1px 2px rgba(255,240,170,0.35)
                  `,
                  background: 'transparent',
                }}>
                  <ComposableMap
                    width={MAP_W}
                    height={MAP_H}
                    projectionConfig={{ center: projCenter, scale: projScale }}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  >
                    <defs>
                      {/* Sombra projetada — dá profundidade à borda inferior/direita */}
                      <filter id="borderShadow" x="-8%" y="-8%" width="116%" height="116%">
                        <feDropShadow dx="1.5" dy="1.5" stdDeviation="1" floodColor="#3d1c08" floodOpacity="0.7" />
                      </filter>
                      {/* Realce especular — simula luz vindo do canto superior esquerdo */}
                      <filter id="borderHighlight" x="-8%" y="-8%" width="116%" height="116%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                        <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1"
                          specularExponent="30" result="spec" lightingColor="#fff8d0">
                          <fePointLight x="-100" y="-100" z="200" />
                        </feSpecularLighting>
                        <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
                        <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic"
                          k1="0" k2="1" k3="0.55" k4="0" />
                      </filter>
                    </defs>

                    <Geographies geography={GEO_URL}>
                      {({ geographies }) => {
                        if (!fittedRef.current && normalizedCountry) {
                          const target = geographies.find((geo) => {
                            const name = getCountryName(geo.id as number)
                            return name ? normalize(name) === normalizedCountry : false
                          })
                          if (target) {
                            const bbox = getGeoBbox(target.geometry as Geometry)
                            if (bbox) {
                              const [[west, south], [east, north]] = bbox
                              const scaleW = (MAP_W * 0.80) / ((east - west) * Math.PI / 180)
                              // Altura correta no Mercator: integral do fator de escala vertical
                              const northRad = north * Math.PI / 180
                              const southRad = south * Math.PI / 180
                              const mercH = Math.log(Math.tan(Math.PI / 4 + northRad / 2)) - Math.log(Math.tan(Math.PI / 4 + southRad / 2))
                              const scaleH = (MAP_H * 0.80) / mercH
                              const center: [number, number] = [(west + east) / 2, (south + north) / 2]
                              fittedRef.current = true
                              setTimeout(() => {
                                setProjCenter(center)
                                setProjScale(Math.min(scaleW, scaleH))
                              }, 0)
                            }
                          }
                        }

                        return geographies
                          .filter((geo) => {
                            const name = getCountryName(geo.id as number)
                            return normalizedCountry && name
                              ? normalize(name) === normalizedCountry
                              : false
                          })
                          .map((geo) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="transparent"
                              stroke="#a07828"
                              strokeWidth={1.5}
                              style={{
                                default: { outline: 'none', filter: 'url(#borderShadow)' },
                                hover:   { outline: 'none' },
                                pressed: { outline: 'none' },
                              }}
                            />
                          ))
                      }}
                    </Geographies>

                    {/* Pin da cidade — só quando há coordenadas */}
                    {hasCoords && (
                      <Marker coordinates={coords}>
                        <g transform="translate(-7, -18)">
                          <ellipse cx="7" cy="19" rx="4" ry="2" fill="rgba(0,0,0,0.18)" />
                          <path
                            d="M7 0C4.1 0 1.7 2.4 1.7 5.4c0 3.9 5.3 11 5.3 11s5.3-7.1 5.3-11C12.3 2.4 9.9 0 7 0z"
                            fill="#c0360a"
                            stroke="#fff"
                            strokeWidth={1}
                          />
                          <circle cx="7" cy="5.4" r="2.2" fill="white" />
                        </g>
                      </Marker>
                    )}
                  </ComposableMap>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
