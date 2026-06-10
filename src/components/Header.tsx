'use client'

export default function Header() {
  return (
    <header className="bg-[#1a2744] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
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
        <div className="h-px w-full sm:h-10 sm:w-px bg-[#b8972a] opacity-50" />
        <p className="text-xs text-gray-300 font-[family-name:var(--font-inter)] text-center sm:text-right max-w-xs">
          Igreja de Jesus Cristo dos<br />Santos dos Últimos Dias
        </p>
      </div>
    </header>
  )
}
