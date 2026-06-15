'use client'

import { useState, useRef, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { Missionary, MissionaryStatus } from '@/types/missionary'
import { getCountryName } from '@/lib/countryNames'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const STATUS_TITLE: Partial<Record<MissionaryStatus, string>> = {
  em_campo:  'Em campo no mundo',
  a_caminho: 'A caminho no mundo',
  retornou:  'Retornaram no mundo',
}

interface WorldMapProps {
  missionaries: Missionary[]
  onSelect: (missionary: Missionary) => void
  filterStatus?: MissionaryStatus | null
}

interface Tooltip {
  x: number
  y: number
  name: string
  missionaryNames: string[]
}

interface Cluster {
  coords: [number, number]
  items: Missionary[]
}

interface Picker {
  x: number
  y: number
  items: Missionary[]
}

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function WorldMap({ missionaries, onSelect, filterStatus }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [picker, setPicker] = useState<Picker | null>(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(GEO_URL)
      .then(() => setGeoLoading(false))
      .catch(() => setGeoLoading(false))
  }, [])

  const title = (filterStatus && STATUS_TITLE[filterStatus]) ?? 'Missionários no mundo'

  // Agrupa missionários em clusters por proximidade de coordenadas
  const clusters = missionaries
    .filter((m) => m.latitude != null && m.longitude != null)
    .reduce<Cluster[]>((acc, m) => {
      const coords: [number, number] = [m.longitude!, m.latitude!]
      const existing = acc.find(
        (c) =>
          Math.abs(c.coords[0] - coords[0]) < 0.5 &&
          Math.abs(c.coords[1] - coords[1]) < 0.5
      )
      if (existing) {
        existing.items.push(m)
      } else {
        acc.push({ coords, items: [m] })
      }
      return acc
    }, [])

  function handlePinClick(cluster: Cluster, e: React.MouseEvent) {
    if (!containerRef.current) return
    if (cluster.items.length === 1) {
      setPicker(null)
      onSelect(cluster.items[0])
    } else {
      const rect = containerRef.current.getBoundingClientRect()
      setPicker({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        items: cluster.items,
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden shadow-xl border border-amber-900/20 relative"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6,23,46,0.72), rgba(7,32,63,0.78)),
          url('https://news-sg.churchofjesuschrist.org/media/960x720/christus-jesus-christ-mormon.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center 18%',
      }}
      onMouseMove={(e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        if (tooltip) {
          setTooltip((t) => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
        }
      }}
      onMouseLeave={() => setTooltip(null)}
      onClick={(e) => {
        // Fecha picker se clicar fora
        if (picker && !(e.target as Element).closest('[data-picker]')) {
          setPicker(null)
        }
      }}
    >
      {/* Cabeçalho */}
      <div className="px-5 pt-4 pb-1 flex items-center justify-between">
        <h2
          className="text-base font-bold text-amber-300"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {title}
        </h2>
        {clusters.length > 0 && (
          <span className="text-xs text-amber-400/70 font-[family-name:var(--font-inter)]">
            {missionaries.length} {missionaries.length === 1 ? 'missionário' : 'missionários'} · {clusters.length} {clusters.length === 1 ? 'local' : 'locais'}
          </span>
        )}
      </div>

      {/* Skeleton enquanto o GeoJSON carrega */}
      {geoLoading && (
        <div className="px-4 pb-4">
          <div
            className="w-full rounded-xl overflow-hidden relative"
            style={{ paddingBottom: '50%', background: 'rgba(10,25,55,0.6)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-3 w-4/5">
                {/* linhas simulando continentes */}
                {[['60%', '15%'], ['80%', '30%'], ['45%', '50%'], ['70%', '65%'], ['35%', '80%']].map(([w, top], i) => (
                  <div
                    key={i}
                    className="absolute h-3 rounded-full"
                    style={{
                      width: w,
                      top,
                      left: '10%',
                      background: 'rgba(184,151,42,0.15)',
                      animation: `pulse 1.8s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(184,151,42,0.06) 50%, transparent 100%)',
                animation: 'shimmer 2s linear infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>
      )}

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 153, center: [10, 0] }}
        style={{ width: '100%', height: 'auto', display: geoLoading ? 'none' : undefined }}
      >
        <defs>
          {/* Gradiente das terras: ouro → bronze */}
          <linearGradient id="landGold" x1="0%" y1="0%" x2="15%" y2="100%">
            <stop offset="0%" stopColor="#d4a843" />
            <stop offset="45%" stopColor="#b8882a" />
            <stop offset="100%" stopColor="#7a5010" />
          </linearGradient>

          {/* Relevo: simula luz vindo do canto superior esquerdo */}
          <filter id="relief" x="-3%" y="-3%" width="106%" height="106%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale="4"
              specularConstant="0.75"
              specularExponent="22"
              result="specular"
              lightingColor="#fff6d0"
            >
              <fePointLight x="250" y="-180" z="350" />
            </feSpecularLighting>
            <feComposite in="specular" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite
              in="SourceGraphic"
              in2="specOut"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="0.45"
              k4="0"
            />
          </filter>

          {/* Brilho dos pins */}
          <filter id="pinGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradiente do oceano (rect de fundo) */}
          <radialGradient id="oceanGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1565a8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06172e" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* Fundo oceano */}
        <rect x="-500" y="-500" width="2000" height="2000" fill="url(#oceanGrad)" />

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="url(#landGold)"
                stroke="#5c3608"
                strokeWidth={0.3}
                style={{
                  default: { outline: 'none', filter: 'url(#relief)', cursor: 'default' },
                  hover: { outline: 'none', fill: '#e8c060', filter: 'url(#relief)', cursor: 'default' },
                  pressed: { outline: 'none', filter: 'url(#relief)' },
                }}
                onMouseEnter={(e) => {
                  const name = getCountryName(geo.id as number)
                  if (!name || !containerRef.current) return
                  const rect = containerRef.current.getBoundingClientRect()
                  const normName = normalize(name)
                  const missionaryNames = missionaries
                    .filter((m) => m.pais_missao && normalize(m.pais_missao) === normName)
                    .map((m) => m.nome)
                  setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name,
                    missionaryNames,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))
          }
        </Geographies>

        {clusters.map((cluster, i) => (
          <Marker key={i} coordinates={cluster.coords}>
            <g
              filter="url(#pinGlow)"
              transform="translate(-8, -20)"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                if (!containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  name: cluster.items.length === 1
                    ? cluster.items[0].pais_missao ?? ''
                    : `${cluster.items.length} missionários`,
                  missionaryNames: cluster.items.map((m) => m.nome),
                })
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={(e) => {
                e.stopPropagation()
                handlePinClick(cluster, e)
              }}
            >
              <ellipse cx="8" cy="22" rx="4" ry="2" fill="rgba(0,0,0,0.35)" />
              <path
                d="M8 0C4.686 0 2 2.686 2 6c0 4.418 6 12 6 12S14 10.418 14 6c0-3.314-2.686-6-6-6z"
                fill="#f0c040"
                stroke="#fff8e0"
                strokeWidth="1"
              />
              {cluster.items.length > 1 ? (
                <text
                  x="8"
                  y="8"
                  textAnchor="middle"
                  fontSize="6"
                  fill="#7a4e08"
                  style={{ userSelect: 'none', fontWeight: 'bold' }}
                >
                  {cluster.items.length}
                </text>
              ) : (
                <text
                  x="8"
                  y="8"
                  textAnchor="middle"
                  fontSize="7"
                  fill="#7a4e08"
                  style={{ userSelect: 'none', fontWeight: 'bold' }}
                >
                  ★
                </text>
              )}
            </g>
          </Marker>
        ))}
      </ComposableMap>

      {missionaries.filter((m) => m.latitude != null).length === 0 && (
        <p className="text-center text-xs text-amber-400/50 font-[family-name:var(--font-inter)] pb-4">
          Nenhum missionário com localização cadastrada ainda.
        </p>
      )}

      {/* Tooltip de hover */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 px-3 py-2 rounded-lg text-xs font-[family-name:var(--font-inter)] shadow-lg"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 40,
            background: 'rgba(6, 23, 46, 0.95)',
            border: '1px solid rgba(184, 151, 42, 0.5)',
            maxWidth: '200px',
          }}
        >
          <p className="font-semibold text-amber-300 whitespace-nowrap">{tooltip.name}</p>
          {tooltip.missionaryNames.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {tooltip.missionaryNames.map((nome) => (
                <li key={nome} className="text-amber-100/80 leading-tight flex items-center gap-1.5">
                  <svg width="8" height="11" viewBox="0 0 8 11" className="shrink-0">
                    <path
                      d="M4 0C2.343 0 1 1.343 1 3c0 2.5 3 8 3 8s3-5.5 3-8C7 1.343 5.657 0 4 0z"
                      fill="#f0c040"
                    />
                    <text x="4" y="4.5" textAnchor="middle" fontSize="3.5" fill="#7a4e08" fontWeight="bold">★</text>
                  </svg>
                  {nome}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Picker para múltiplos missionários no mesmo pin */}
      {picker && (
        <div
          data-picker
          className="absolute z-20 rounded-xl text-xs font-[family-name:var(--font-inter)] shadow-2xl overflow-hidden"
          style={{
            left: Math.min(picker.x + 14, (containerRef.current?.offsetWidth ?? 400) - 220),
            top: picker.y - 8,
            background: 'rgba(6, 23, 46, 0.97)',
            border: '1px solid rgba(184, 151, 42, 0.6)',
            minWidth: '180px',
            maxWidth: '220px',
          }}
        >
          <p className="px-3 pt-2.5 pb-1.5 text-amber-400/70 text-[11px] uppercase tracking-wider border-b border-amber-900/40">
            Selecionar missionário
          </p>
          <ul>
            {picker.items.map((m) => (
              <li key={m.id}>
                <button
                  className="w-full text-left px-3 py-2 text-amber-100 hover:bg-amber-900/40 transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPicker(null)
                    onSelect(m)
                  }}
                >
                  <svg width="8" height="11" viewBox="0 0 8 11" className="shrink-0">
                    <path
                      d="M4 0C2.343 0 1 1.343 1 3c0 2.5 3 8 3 8s3-5.5 3-8C7 1.343 5.657 0 4 0z"
                      fill="#f0c040"
                    />
                  </svg>
                  {m.nome}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
