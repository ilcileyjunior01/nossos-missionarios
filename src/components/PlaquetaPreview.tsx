'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Printer, UserCircle, Download, Zap, Upload, CheckCircle } from 'lucide-react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { Missionary } from '@/types/missionary'
import { getCountryAlpha2, getAlpha2FromNumericId } from '@/lib/countryNames'
import { supabase } from '@/lib/supabase'

const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ── Template: 1533 × 2121 px (13×18 cm @ 300 DPI) ────────────────────────
// Exibição em tela: 390 × 540 px  (escala ≈ 0.2545)
const W = 390
const H = 540

// Coordenadas calibradas visualmente via /debug-template
const PHOTO_L = 36
const PHOTO_T = 43
const PHOTO_W = 151
const PHOTO_H = 274

const MN_L    = 192   // nome da missão left edge (logo após a foto)
const MN_T    = 80    // nome da missão top

const NAME_L  = PHOTO_L
const NAME_T  = 333
const NAME_W  = PHOTO_W

const MAP_L   = 208
const MAP_T   = 329
const MAP_W   = 151
const MAP_H   = 138

const FLAG_L  = 113
const FLAG_T  = 455

const FT_Y    = 502
const ALA_L   = 32
const DATE_L  = 197

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

function normalize(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

type Coord    = number[]
type Geometry = { type: string; coordinates: unknown }

function getGeoBbox(geometry: Geometry): [[number, number], [number, number]] | null {
  let cs: Coord[] = []
  if (geometry.type === 'Polygon')
    cs = (geometry.coordinates as Coord[][])[0]
  else if (geometry.type === 'MultiPolygon') {
    const rings = (geometry.coordinates as Coord[][][]).map(p => p[0])
    cs = rings.reduce((a, b) => (a.length >= b.length ? a : b))
  }
  if (!cs.length) return null
  const lons = cs.map(c => c[0]), lats = cs.map(c => c[1])
  return [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]]
}

interface Props {
  missionary: Missionary
  onClose: () => void
}

export default function PlaquetaPreview({ missionary, onClose }: Props) {
  const titulo    = missionary.genero === 'F' ? 'Sister' : missionary.genero === 'M' ? 'Elder' : null
  const hasCoords = missionary.latitude != null && missionary.longitude != null
  const coords: [number, number] = hasCoords
    ? [missionary.longitude!, missionary.latitude!]
    : [-51, -14]

  const isBrazil          = normalize(missionary.pais_missao ?? '') === 'brasil' || missionary.eh_servico
  const alpha2            = getCountryAlpha2(missionary.pais_missao)
  const flagUrl           = alpha2 ? `https://flagcdn.com/w80/${alpha2}.png` : null
  const normalizedCountry = missionary.pais_missao ? normalize(missionary.pais_missao) : null

  const missaoNome = (() => {
    const pais = missionary.pais_missao ?? ''
    const nome = missionary.nome_missao  ?? ''
    if (!pais && !nome) return ''
    if (!nome) return pais
    if (!pais) return nome
    if (normalize(nome).startsWith(normalize(pais))) return nome
    return `${pais} ${nome}`
  })()


  const [laserMode,   setLaserMode]   = useState(false)
  const [laserUrl,    setLaserUrl]    = useState<string | null>(missionary.plaqueta_laser_url ?? null)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLaserUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadState('uploading')

    try {
      const ext  = file.name.toLowerCase().endsWith('.svg') ? 'svg' : 'png'
      const path = `laser/${missionary.id}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('fotos-missionarios')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('fotos-missionarios')
        .getPublicUrl(path)

      const { error: updateErr } = await supabase
        .from('missionaries')
        .update({ plaqueta_laser_url: publicUrl })
        .eq('id', missionary.id)
      if (updateErr) throw updateErr

      setLaserUrl(publicUrl)
      setUploadState('done')
    } catch (err) {
      console.error('Erro no upload laser:', err)
      setUploadState('error')
    } finally {
      // reset input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [missionary.id])
  const [projCenter, setProjCenter] = useState<[number, number]>(hasCoords ? coords : [0, 0])
  const [projScale, setProjScale] = useState(200)
  const fittedRef   = useRef(false)
  const plaquetaRef = useRef<HTMLDivElement>(null)

  const handleExportPng = useCallback(async () => {
    if (!plaquetaRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(plaquetaRef.current, { pixelRatio: 4, cacheBust: true })
      const a = document.createElement('a')
      a.download = `plaqueta-${missionary.nome.replace(/\s+/g, '-')}.png`
      a.href = dataUrl
      a.click()
    } catch (err) {
      console.error('Erro ao exportar PNG:', err)
    }
  }, [missionary.nome])

  const handlePrint = useCallback(async () => {
    if (!plaquetaRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(plaquetaRef.current, { pixelRatio: 4, cacheBust: true })
      const win = window.open('', '_blank')
      if (!win) { alert('Permita pop-ups para imprimir.'); return }
      win.document.write(`<!DOCTYPE html><html><head><style>
        @page { size: 130mm 180mm; margin: 0; }
        body { margin: 0; padding: 0; }
        img { width: 130mm; height: 180mm; display: block; }
      </style></head><body>
        <img src="${dataUrl}" />
        <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body></html>`)
      win.document.close()
    } catch (err) {
      console.error('Erro ao imprimir:', err)
    }
  }, [])

  return (
    <div className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">

      {/* ── Input oculto para upload laser ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/svg+xml"
        className="hidden"
        onChange={handleLaserUpload}
      />

      {/* ── Controles ── */}
      <div className="absolute top-4 right-4 flex flex-wrap gap-2 print:hidden">
        <button
          onClick={() => setLaserMode(m => !m)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors font-[family-name:var(--font-inter)] ${
            laserMode ? 'bg-white text-gray-900' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {laserMode ? '🎨 Colorido' : '⚫ Modo Laser'}
        </button>
        <button
          onClick={handleExportPng}
          className="flex items-center gap-2 bg-[#b8972a] hover:bg-[#9f7f1f] text-white rounded-full px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors"
        >
          <Download size={15} /> Exportar PNG
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#b8972a] hover:bg-[#9f7f1f] text-white rounded-full px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors"
        >
          <Printer size={15} /> Imprimir
        </button>
        <a
          href={`/api/plaqueta-laser?id=${missionary.id}`}
          download={`plaqueta-laser-${missionary.nome.replace(/\s+/g, '-')}.png`}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white rounded-full px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors border border-white/20"
        >
          <Zap size={15} /> Laser PNG
        </a>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState === 'uploading'}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white rounded-full px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors border border-white/20 disabled:opacity-50"
        >
          {uploadState === 'uploading' ? (
            <><Upload size={15} className="animate-pulse" /> Salvando...</>
          ) : uploadState === 'done' ? (
            <><CheckCircle size={15} className="text-green-400" /> Salvo!</>
          ) : uploadState === 'error' ? (
            <><Upload size={15} className="text-red-400" /> Erro — tentar novamente</>
          ) : (
            <><Upload size={15} /> Importar Laser</>
          )}
        </button>
        {laserUrl && (
          <a
            href={laserUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white rounded-full px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors"
          >
            <Download size={15} /> Ver Laser salvo
          </a>
        )}
        <button onClick={onClose} aria-label="Fechar"
          className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* ══════════════════ PLAQUETA ══════════════════ */}
      <div
        ref={plaquetaRef}
        id="plaqueta-missionaria"
        style={{
          position: 'relative',
          width: W,
          height: H,
          backgroundImage: "url('/template-plaqueta.jpg')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          filter: laserMode ? 'grayscale(100%) contrast(160%) brightness(115%)' : 'none',
        }}
      >

        {/* ── 1. FOTO ── */}
        <div style={{
          position: 'absolute',
          left: PHOTO_L, top: PHOTO_T,
          width: PHOTO_W, height: PHOTO_H,
          overflow: 'hidden',
        }}>
          {missionary.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={missionary.foto_url}
              alt={missionary.nome}
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#e8e8e8',
            }}>
              <UserCircle size={56} color="#aaa" />
            </div>
          )}
        </div>

        {/* ── 2. NOME DA MISSÃO (abaixo de "Missão" que já está no template) ── */}
        {missaoNome && (
          <div style={{
            position: 'absolute',
            left: MN_L, top: MN_T,
            width: W - MN_L - 4,
            textAlign: 'center',
          }}>
            <p style={{
              margin: 0,
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: missaoNome.length <= 16 ? 15 : missaoNome.length <= 22 ? 13 : missaoNome.length <= 28 ? 11 : 9,
              fontWeight: 700,
              color: '#111',
              lineHeight: 1.25,
            }}>
              {missaoNome}
            </p>
          </div>
        )}

        {/* ── 3. SISTER/ELDER + NOME ── */}
        <div style={{
          position: 'absolute',
          left: NAME_L, top: NAME_T,
          width: NAME_W,
          textAlign: 'center',
        }}>
          {titulo && (
            <p style={{
              margin: 0,
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: 10,
              fontWeight: 700,
              color: '#111',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {titulo}
            </p>
          )}
          <p style={{
            margin: '2px 0 0',
            fontFamily: '"Comic Sans MS", cursive',
            fontSize: 16,
            fontWeight: 700,
            color: '#111',
            lineHeight: 1.2,
          }}>
            {missionary.nome}
          </p>
        </div>

        {/* ── 4. MAPA ── */}
        <div style={{
          position: 'absolute',
          left: MAP_L, top: MAP_T,
          width: MAP_W, height: MAP_H,
        }}>
          <ComposableMap
            width={MAP_W} height={MAP_H}
            projectionConfig={{ center: projCenter, scale: projScale }}
            style={{ width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 0 12px rgba(30,80,220,1))' }}
          >
            <Geographies geography={WORLD_URL}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {({ geographies }) => {
                const geos = geographies as any[]
                if (!fittedRef.current && alpha2) {
                  const target = geos.find(g => getAlpha2FromNumericId(g.id) === alpha2)
                  if (target) {
                    const bbox = getGeoBbox(target.geometry as Geometry)
                    if (bbox) {
                      const [[west, south], [east, north]] = bbox
                      const scaleW = (MAP_W * 0.96) / ((east - west) * Math.PI / 180)
                      const northR = north * Math.PI / 180
                      const southR = south * Math.PI / 180
                      const mercH  = Math.log(Math.tan(Math.PI/4 + northR/2)) - Math.log(Math.tan(Math.PI/4 + southR/2))
                      const scaleH = (MAP_H * 0.96) / mercH
                      fittedRef.current = true
                      setTimeout(() => {
                        setProjCenter([(west + east) / 2, (south + north) / 2])
                        setProjScale(Math.min(scaleW, scaleH * 1.1))
                      }, 0)
                    }
                  }
                }
                return geos
                  .filter(g => alpha2 && getAlpha2FromNumericId(g.id) === alpha2)
                  .map(g => (
                    <Geography
                      key={g.rsmKey} geography={g}
                      style={{
                        default: { fill: '#d0d0d0', stroke: '#555', strokeWidth: 0.9, outline: 'none' },
                        hover:   { fill: '#d0d0d0', stroke: '#555', strokeWidth: 0.9, outline: 'none' },
                        pressed: { fill: '#d0d0d0', stroke: '#555', strokeWidth: 0.9, outline: 'none' },
                      }}
                    />
                  ))
              }}
            </Geographies>
            {hasCoords && (
              <Marker coordinates={coords}>
                <g transform="translate(-5,-13)">
                  <ellipse cx="5" cy="14" rx="3" ry="1.5" fill="rgba(0,0,0,0.25)" />
                  <path d="M5 0C2.9 0 1.2 1.8 1.2 4c0 2.9 3.8 8 3.8 8S8.8 6.9 8.8 4C8.8 1.8 7.1 0 5 0z" fill="#1a56db" />
                  <circle cx="5" cy="4" r="1.7" fill="white" />
                </g>
              </Marker>
            )}
          </ComposableMap>
        </div>

        {/* ── 5. BANDEIRA ── */}
        {flagUrl && (
          <div style={{
            position: 'absolute',
            left: FLAG_L, top: FLAG_T,
            width: MAP_W,
            display: 'flex',
            justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl}
              alt={missionary.pais_missao ?? ''}
              crossOrigin="anonymous"
              style={{ height: 40, width: 'auto', border: '1px solid #bbb', display: 'block' }}
            />
          </div>
        )}

        {/* ── 6. NOME DA ALA (após "Ala:" já no template) ── */}
        <p style={{
          position: 'absolute',
          left: ALA_L, top: FT_Y,
          margin: 0,
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: 12, color: '#111',
        }}>
          {missionary.ala ?? ''}
        </p>

        {/* ── 7. DATAS ── */}
        <p style={{
          position: 'absolute',
          left: DATE_L, top: FT_Y,
          margin: 0,
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: 12, color: '#111',
        }}>
          {formatDate(missionary.data_inicio)} - {formatDate(missionary.data_termino)}
        </p>

      </div>
    </div>
  )
}
