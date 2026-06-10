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
      <div className="w-full h-32 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
        <p className="text-xs text-gray-400 font-[family-name:var(--font-inter)]">
          Localização não cadastrada
        </p>
      </div>
    )
  }

  const coords: [number, number] = [missionary.longitude!, missionary.latitude!]

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-100 bg-[#e8eef4]">
      <ComposableMap
        projectionConfig={{ scale: 200 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup center={coords} zoom={4} disablePanning>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#c8d8e8"
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          <Marker coordinates={coords}>
            <g transform="translate(-8, -20)">
              <ellipse cx="8" cy="22" rx="4" ry="2" fill="rgba(0,0,0,0.15)" />
              <path
                d="M8 0C4.686 0 2 2.686 2 6c0 4.418 6 12 6 12S14 10.418 14 6c0-3.314-2.686-6-6-6z"
                fill="#b8972a"
                stroke="#ffffff"
                strokeWidth="1"
              />
              <text
                x="8"
                y="8"
                textAnchor="middle"
                fontSize="7"
                fill="white"
                style={{ userSelect: 'none' }}
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
