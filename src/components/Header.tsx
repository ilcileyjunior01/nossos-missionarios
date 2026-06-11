'use client'

import { useState } from 'react'
import { LogIn, LogOut, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'

function TempleIcon() {
  // Silhueta do Templo de São Paulo: espira única esbelta, torre central, alas baixas
  return (
    <svg
      width="34" height="42" viewBox="0 0 34 42"
      fill="#f0d97a" aria-hidden="true"
      className="shrink-0 drop-shadow-sm"
    >
      {/* Figura dourada no topo da espira */}
      <circle cx="17" cy="1" r="1.5" />
      {/* Espira — muito esbelta, característica do Templo SP */}
      <path d="M17,1 L15.2,17 L18.8,17 Z" />
      {/* Torre: topo escalonado */}
      <rect x="13.5" y="17" width="7" height="2.5" />
      <rect x="11.5" y="19.5" width="11" height="2" />
      {/* Torre: corpo central */}
      <rect x="11" y="21.5" width="12" height="12" />
      {/* Entrada arqueada (portal central) */}
      <rect x="14.5" y="25" width="5" height="8" fill="#1a2744" opacity="0.45" />
      {/* Alas baixas horizontais */}
      <rect x="0" y="29" width="11" height="4.5" />
      <rect x="23" y="29" width="11" height="4.5" />
      {/* Base escalonada */}
      <rect x="0" y="33.5" width="34" height="2.5" />
      <rect x="2" y="36" width="30" height="2" />
      <rect x="5" y="38" width="24" height="2" />
    </svg>
  )
}

export default function Header() {
  const { user, signOut, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
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

          {/* Lado direito: descrição + auth */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <p className="text-xs text-gray-300 font-[family-name:var(--font-inter)] text-center sm:text-right max-w-xs">
              Igreja de Jesus Cristo dos<br />Santos dos Últimos Dias
            </p>
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-[#f0d97a]/80 font-[family-name:var(--font-inter)]">
                    <Shield size={11} />
                    Líder
                  </span>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white font-[family-name:var(--font-inter)] transition-colors"
                  >
                    <LogOut size={12} />
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-1.5 text-[11px] text-white/60 hover:text-[#f0d97a] font-[family-name:var(--font-inter)] transition-colors"
                >
                  <LogIn size={12} />
                  Acesso de líder
                </button>
              )
            )}
          </div>
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

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
