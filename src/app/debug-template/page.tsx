'use client'

import { useState, useRef, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const W = 390
const H = 540

const BRAZIL_STATES_URL = '/brazil-states.json'

const INITIAL = {
  photoL:  55,  photoT:  52,  photoW: 110, photoH: 190,
  rc:      152, mnT:     72,  mnW:    250,
  nameL:   61,  nameT:   326,
  mapL:    147, mapT:    288, mapW:   254, mapH:  200,
  flagL:   157, flagT:   475,
  ftY:     504, alaL:    19,  dateL:  166,
}

type Params = typeof INITIAL

const MOCK = {
  nome:        'Beatriz Silva Cavalcante',
  titulo:      'Sister',
  ala:         'Jardim Helena',
  dataInicio:  '10/02/2025',
  dataTermino: '22/07/2026',
  missao:      'Brasil Salvador',
  lat:         -12.9714,
  lon:         -38.5014,
}

function Slider({ label, k, v, min, max, onChange }: {
  label: string; k: string; v: number; min: number; max: number
  onChange: (k: string, v: number) => void
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#ccc' }}>
        <span>{label}</span><span style={{ color: '#7cf' }}>{v}</span>
      </div>
      <input
        type="range" min={min} max={max} value={v}
        onChange={e => onChange(k, Number(e.target.value))}
        style={{ width: '100%', accentColor: '#7cf' }}
      />
    </div>
  )
}

export default function DebugTemplate() {
  const [p, setP] = useState<Params>({ ...INITIAL })
  const set = useCallback((k: string, v: number) => setP(prev => ({ ...prev, [k]: v })), [])
  const containerRef = useRef<HTMLDivElement>(null)

  const mnW = p.mnW
  const coords: [number, number] = [p.lon, p.lat]

  const code = `// Coordenadas calibradas
const PHOTO_L = ${p.photoL}
const PHOTO_T = ${p.photoT}
const PHOTO_W = ${p.photoW}
const PHOTO_H = ${p.photoH}
const RC      = ${p.rc}
const MN_T    = ${p.mnT}
const MN_W    = ${p.mnW}
const NAME_L  = ${p.nameL}
const NAME_T  = ${p.nameT}
const MAP_L   = ${p.mapL}
const MAP_T   = ${p.mapT}
const MAP_W   = ${p.mapW}
const MAP_H   = ${p.mapH}
const FLAG_L  = ${p.flagL}
const FLAG_T  = ${p.flagT}
const FT_Y    = ${p.ftY}
const ALA_L   = ${p.alaL}
const DATE_L  = ${p.dateL}`

  return (
    <div style={{ background: '#111', minHeight: '100vh', display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── PREVIEW REAL ── */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: W, height: H,
          flexShrink: 0,
          backgroundImage: "url('/template-plaqueta.jpg')",
          backgroundSize: '100% 100%',
          overflow: 'hidden',
        }}
      >
        {/* FOTO placeholder */}
        <div style={{
          position: 'absolute',
          left: p.photoL, top: p.photoT,
          width: p.photoW, height: p.photoH,
          background: '#ddd',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#999',
        }}>
          FOTO
        </div>

        {/* NOME MISSÃO */}
        <div style={{
          position: 'absolute',
          left: p.rc, top: p.mnT,
          width: mnW,
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontFamily: '"Times New Roman", Georgia, serif',
            fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.25,
          }}>
            {MOCK.missao}
          </p>
        </div>

        {/* SISTER + NOME */}
        <div style={{
          position: 'absolute',
          left: p.nameL, top: p.nameT,
          width: p.rc - p.nameL - 4,
        }}>
          <p style={{
            margin: 0,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 8, fontWeight: 700, color: '#111',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {MOCK.titulo}
          </p>
          <p style={{
            margin: '1px 0 0',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 11, fontWeight: 700, color: '#111', lineHeight: 1.2,
          }}>
            {MOCK.nome}
          </p>
        </div>

        {/* MAPA */}
        <div style={{
          position: 'absolute',
          left: p.mapL, top: p.mapT,
          width: p.mapW, height: p.mapH,
        }}>
          <ComposableMap
            width={p.mapW} height={p.mapH}
            projectionConfig={{ center: [-51, -14], scale: 213 }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <Geographies geography={BRAZIL_STATES_URL}>
              {({ geographies }) => geographies.map(geo => (
                <Geography
                  key={geo.rsmKey} geography={geo}
                  fill="#e8e8e8" stroke="#666" strokeWidth={0.8}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                />
              ))}
            </Geographies>
            <Marker coordinates={coords}>
              <g transform="translate(-5,-13)">
                <ellipse cx="5" cy="14" rx="3" ry="1.5" fill="rgba(0,0,0,0.25)" />
                <path d="M5 0C2.9 0 1.2 1.8 1.2 4c0 2.9 3.8 8 3.8 8S8.8 6.9 8.8 4C8.8 1.8 7.1 0 5 0z" fill="#1a56db" />
                <circle cx="5" cy="4" r="1.7" fill="white" />
              </g>
            </Marker>
          </ComposableMap>
        </div>

        {/* BANDEIRA */}
        <div style={{
          position: 'absolute',
          left: p.flagL, top: p.flagT,
          width: p.mapW,
          display: 'flex', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://flagcdn.com/w80/br.png"
            alt="Brasil"
            style={{ height: 20, width: 'auto', border: '1px solid #bbb' }}
          />
        </div>

        {/* ALA */}
        <p style={{
          position: 'absolute',
          left: p.alaL, top: p.ftY,
          margin: 0,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 10, color: '#111',
        }}>
          {MOCK.ala}
        </p>

        {/* DATAS */}
        <p style={{
          position: 'absolute',
          left: p.dateL, top: p.ftY,
          margin: 0,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 10, color: '#111',
        }}>
          {MOCK.dataInicio} - {MOCK.dataTermino}
        </p>
      </div>

      {/* ── CONTROLES ── */}
      <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 12, width: 240, flexShrink: 0 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#7cf' }}>FOTO</h3>
        <Slider label="left"   k="photoL" v={p.photoL} min={0}   max={200} onChange={set} />
        <Slider label="top"    k="photoT" v={p.photoT} min={0}   max={300} onChange={set} />
        <Slider label="width"  k="photoW" v={p.photoW} min={40}  max={250} onChange={set} />
        <Slider label="height" k="photoH" v={p.photoH} min={40}  max={350} onChange={set} />

        <h3 style={{ margin: '10px 0 8px', fontSize: 13, color: '#7cf' }}>NOME MISSÃO</h3>
        <Slider label="col direita (rc)" k="rc"  v={p.rc}  min={80}  max={280} onChange={set} />
        <Slider label="top"              k="mnT" v={p.mnT} min={20}  max={200} onChange={set} />
        <Slider label="width"            k="mnW" v={p.mnW} min={60}  max={280} onChange={set} />

        <h3 style={{ margin: '10px 0 8px', fontSize: 13, color: '#7cf' }}>SISTER + NOME</h3>
        <Slider label="left" k="nameL" v={p.nameL} min={0}   max={150} onChange={set} />
        <Slider label="top"  k="nameT" v={p.nameT} min={150} max={500} onChange={set} />

        <h3 style={{ margin: '10px 0 8px', fontSize: 13, color: '#7cf' }}>MAPA</h3>
        <Slider label="left"   k="mapL" v={p.mapL} min={80}  max={280} onChange={set} />
        <Slider label="top"    k="mapT" v={p.mapT} min={100} max={400} onChange={set} />
        <Slider label="width"  k="mapW" v={p.mapW} min={80}  max={280} onChange={set} />
        <Slider label="height" k="mapH" v={p.mapH} min={60}  max={280} onChange={set} />

        <h3 style={{ margin: '10px 0 8px', fontSize: 13, color: '#7cf' }}>BANDEIRA</h3>
        <Slider label="left" k="flagL" v={p.flagL} min={80}  max={280} onChange={set} />
        <Slider label="top"  k="flagT" v={p.flagT} min={200} max={530} onChange={set} />

        <h3 style={{ margin: '10px 0 8px', fontSize: 13, color: '#7cf' }}>RODAPÉ</h3>
        <Slider label="top (ala+datas)" k="ftY"   v={p.ftY}   min={400} max={535} onChange={set} />
        <Slider label="ala left"        k="alaL"  v={p.alaL}  min={0}   max={200} onChange={set} />
        <Slider label="datas left"      k="dateL" v={p.dateL} min={50}  max={350} onChange={set} />
      </div>

      {/* ── CÓDIGO GERADO ── */}
      <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 11, flex: 1, minWidth: 260 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#7cf' }}>Código gerado</h3>
        <p style={{ color: '#aaa', fontSize: 10, margin: '0 0 8px' }}>
          Quando estiver satisfeito, copie e envie.
        </p>
        <pre style={{
          background: '#1a1a1a', padding: 12, borderRadius: 6,
          color: '#7cf', whiteSpace: 'pre-wrap', margin: 0,
        }}>
          {code}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          style={{
            marginTop: 8, padding: '6px 14px', background: '#7cf',
            color: '#111', border: 'none', borderRadius: 4, cursor: 'pointer',
            fontWeight: 700, fontSize: 12,
          }}
        >
          Copiar código
        </button>
      </div>

    </div>
  )
}
