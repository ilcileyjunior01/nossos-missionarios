'use client'

import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Missionary } from '@/types/missionary'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface MissionaryMapProps {
  missionary: Missionary
}

export default function MissionaryMap({ missionary }: MissionaryMapProps) {
  const hasCoords = missionary.latitude != null && missionary.longitude != null

  if (!hasCoords) {
    return (
      <div
        className="w-full h-32 rounded-xl flex items-center justify-center border border-amber-900/20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,23,46,0.82), rgba(7,32,63,0.88)),
            url('https://news-sg.churchofjesuschrist.org/media/960x720/christus-jesus-christ-mormon.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center 18%',
        }}
      >
        <p className="text-xs text-amber-400/60 font-[family-name:var(--font-inter)]">
          Localização não cadastrada
        </p>
      </div>
    )
  }

  const coords: [number, number] = [missionary.longitude!, missionary.latitude!]

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-amber-900/20 shadow-lg"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6,23,46,0.72), rgba(7,32,63,0.78)),
          url('https://news-sg.churchofjesuschrist.org/media/960x720/christus-jesus-christ-mormon.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center 18%',
      }}
    >
      {/* Legenda */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <svg width="10" height="13" viewBox="0 0 8 11">
          <path
            d="M4 0C2.343 0 1 1.343 1 3c0 2.5 3 8 3 8s3-5.5 3-8C7 1.343 5.657 0 4 0z"
            fill="#f0c040"
          />
          <text x="4" y="4.5" textAnchor="middle" fontSize="3.5" fill="#7a4e08" fontWeight="bold">★</text>
        </svg>
        <span
          className="text-xs text-amber-300/80 font-[family-name:var(--font-inter)] truncate"
        >
          {missionary.pais_missao ?? 'Campo de missão'}
        </span>
        <span className="ml-auto text-[10px] text-amber-400/40 font-[family-name:var(--font-inter)] shrink-0">
          scroll · arrastar para navegar
        </span>
      </div>

      <ComposableMap
        projectionConfig={{ scale: 200 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <defs>
          <linearGradient id="mmLandGold" x1="0%" y1="0%" x2="15%" y2="100%">
            <stop offset="0%" stopColor="#d4a843" />
            <stop offset="45%" stopColor="#b8882a" />
            <stop offset="100%" stopColor="#7a5010" />
          </linearGradient>

          <filter id="mmRelief" x="-3%" y="-3%" width="106%" height="106%">
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

          <filter id="mmPinGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="mmOceanGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1565a8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06172e" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        <ZoomableGroup center={coords} zoom={4}>
          {/* Fundo oceano */}
          <rect x="-500" y="-500" width="2000" height="2000" fill="url(#mmOceanGrad)" />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="url(#mmLandGold)"
                  stroke="#5c3608"
                  strokeWidth={0.3}
                  style={{
                    default: { outline: 'none', filter: 'url(#mmRelief)' },
                    hover:   { outline: 'none', fill: '#e8c060', filter: 'url(#mmRelief)' },
                    pressed: { outline: 'none', filter: 'url(#mmRelief)' },
                  }}
                />
              ))
            }
          </Geographies>

          <Marker coordinates={coords}>
            <g filter="url(#mmPinGlow)" transform="translate(-8, -20)">
              <ellipse cx="8" cy="22" rx="4" ry="2" fill="rgba(0,0,0,0.35)" />
              <path
                d="M8 0C4.686 0 2 2.686 2 6c0 4.418 6 12 6 12S14 10.418 14 6c0-3.314-2.686-6-6-6z"
                fill="#f0c040"
                stroke="#fff8e0"
                strokeWidth="1"
              />
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
            </g>
          </Marker>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
