'use client'

function TempleIcon() {
  return (
    <svg
      width="34" height="40" viewBox="0 0 34 40"
      fill="#f0d97a" aria-hidden="true"
      className="shrink-0 drop-shadow-sm"
    >
      {/* Espira central (mais alta) */}
      <polygon points="17,0 14,10 20,10" />
      <rect x="14.5" y="10" width="5" height="7" />
      {/* Espiras laterais internas */}
      <polygon points="10,5 8,13 12,13" />
      <rect x="8.5" y="13" width="3.5" height="5" />
      <polygon points="24,5 22,13 26,13" />
      <rect x="22.5" y="13" width="3.5" height="5" />
      {/* Espiras externas */}
      <polygon points="4,9 2,16 6,16" />
      <rect x="2.5" y="16" width="3" height="4" />
      <polygon points="30,9 28,16 32,16" />
      <rect x="28.5" y="16" width="3" height="4" />
      {/* Corpo do templo */}
      <rect x="1" y="20" width="32" height="14" />
      {/* Janelas */}
      <rect x="5" y="23" width="5" height="7" fill="#1a2744" opacity="0.6" />
      <rect x="14.5" y="23" width="5" height="7" fill="#1a2744" opacity="0.6" />
      <rect x="24" y="23" width="5" height="7" fill="#1a2744" opacity="0.6" />
      {/* Base */}
      <rect x="0" y="34" width="34" height="3" />
      <rect x="2" y="37" width="30" height="3" />
    </svg>
  )
}

export default function Header() {
  return (
    <header
      className="text-white shadow-lg relative overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(rgba(18,28,52,0.88), rgba(26,39,68,0.94)),
          url('https://news-sg.churchofjesuschrist.org/media/960x720/Centro_de_visitantes_Externa-090-min.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center 35%',
      }}
    >

      {/* Textura sutil de madeira horizontal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(91deg, transparent, transparent 8px, rgba(255,255,255,0.025) 8px, rgba(255,255,255,0.025) 16px)',
        }}
      />

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 relative">

        {/* Lado esquerdo: ícone + títulos */}
        <div className="flex items-center gap-3">
          <TempleIcon />
          <div className="text-center sm:text-left">
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-wide"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Nossos Missionários
            </h1>
            <p className="text-[#f0d97a] text-sm mt-0.5 font-[family-name:var(--font-inter)] tracking-widest uppercase">
              Estaca SP BR Taboão
            </p>
          </div>
        </div>

        <div className="h-px w-full sm:h-10 sm:w-px bg-[#b8972a] opacity-50" />

        <p className="text-xs text-gray-300 font-[family-name:var(--font-inter)] text-center sm:text-right max-w-xs">
          Igreja de Jesus Cristo dos<br />Santos dos Últimos Dias
        </p>
      </div>

      {/* Borda dourada ornamental inferior */}
      <div className="relative h-[3px]" style={{
        background: 'linear-gradient(to right, transparent, #b8972a 15%, #d4a843 50%, #b8972a 85%, transparent)',
      }}>
        {/* Diamante central */}
        <svg
          width="14" height="14" viewBox="0 0 14 14"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <polygon points="7,0 14,7 7,14 0,7" fill="#d4a843" />
          <polygon points="7,3 11,7 7,11 3,7" fill="#1a2744" />
        </svg>
      </div>
    </header>
  )
}
