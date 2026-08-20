'use client'

import { useState } from 'react'
import { LogIn, LogOut, Shield, Download, KeyRound, X, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
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

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) { setError('Erro ao atualizar a senha. Tente novamente.') }
    else { setSuccess(true); setTimeout(onClose, 2000) }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="modal-panel bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1a2744 0%, #253660 100%)' }}>
          <div>
            <h2 className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>Trocar Senha</h2>
            <p className="text-[#f0d97a]/70 text-xs mt-0.5 font-[family-name:var(--font-inter)]">Estaca SP BR Taboão</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-6">
          {success ? (
            <p className="text-sm text-green-600 text-center font-[family-name:var(--font-inter)] py-4">Senha atualizada com sucesso!</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cp-password" className="block text-xs font-medium text-gray-500 font-[family-name:var(--font-inter)] uppercase tracking-wider">Nova senha</label>
                <div className="relative">
                  <input id="cp-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus minLength={6} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cp-confirm" className="block text-xs font-medium text-gray-500 font-[family-name:var(--font-inter)] uppercase tracking-wider">Confirmar senha</label>
                <input id="cp-confirm" type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Repita a senha" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors" />
              </div>
              {error && <p className="text-xs text-red-500 font-[family-name:var(--font-inter)] text-center">{error}</p>}
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#1a2744] hover:bg-[#253660] disabled:opacity-60 text-white text-sm font-medium font-[family-name:var(--font-inter)] py-2.5 rounded-xl transition-colors">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                Salvar nova senha
              </button>
            </form>
          )}
        </div>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#b8972a] to-transparent" />
      </div>
    </div>
  )
}

export default function Header() {
  const { user, signOut, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

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
              <p
                className="text-xl sm:text-3xl font-bold tracking-[0.22em] uppercase"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  background: 'linear-gradient(90deg, #92700a, #f0d97a 40%, #d4a843 60%, #92700a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 6px rgba(240,217,122,0.5))',
                }}
              >
                ✦ Estaca SP BR Taboão ✦
              </p>
              <h1
                className="text-sm sm:text-base font-medium tracking-wide text-white/70 mt-0.5"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Nossos Missionários
              </h1>
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
                  <Link
                    href="/importar"
                    className="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-[#f0d97a] font-[family-name:var(--font-inter)] transition-colors"
                    title="Importar missionários do LCR"
                  >
                    <Download size={12} />
                    Importar LCR
                  </Link>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-[#f0d97a] font-[family-name:var(--font-inter)] transition-colors"
                  >
                    <KeyRound size={12} />
                    Trocar senha
                  </button>
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
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </>
  )
}
