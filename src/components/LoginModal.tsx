'use client'

import { useState } from 'react'
import { X, Loader2, LogIn, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginModalProps {
  onClose: () => void
}

type View = 'login' | 'forgot' | 'forgot-sent'

export default function LoginModal({ onClose }: LoginModalProps) {
  const { signIn, sendPasswordReset } = useAuth()
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('E-mail ou senha incorretos.')
    } else {
      onClose()
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await sendPasswordReset(email)
    setLoading(false)
    if (error) {
      setError('Erro ao enviar e-mail. Verifique o endereço e tente novamente.')
    } else {
      setView('forgot-sent')
    }
  }

  const headerTitle = view === 'login' ? 'Acesso de Líder' : 'Recuperar Senha'

  return (
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="modal-panel bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #1a2744 0%, #253660 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            {view !== 'login' && (
              <button
                onClick={() => { setView('login'); setError(null) }}
                className="text-white/60 hover:text-white transition-colors mr-1"
                aria-label="Voltar"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2
                className="text-white text-lg font-bold"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {headerTitle}
              </h2>
              <p className="text-[#f0d97a]/70 text-xs mt-0.5 font-[family-name:var(--font-inter)]">
                Estaca SP BR Taboão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* === VIEW: LOGIN === */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="px-6 py-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-500 font-[family-name:var(--font-inter)] uppercase tracking-wider"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="lider@exemplo.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-500 font-[family-name:var(--font-inter)] uppercase tracking-wider"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-[family-name:var(--font-inter)] text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1a2744] hover:bg-[#253660] disabled:opacity-60 text-white text-sm font-medium font-[family-name:var(--font-inter)] py-2.5 rounded-xl transition-colors mt-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              Entrar
            </button>

            <button
              type="button"
              onClick={() => { setView('forgot'); setError(null) }}
              className="w-full text-center text-xs text-gray-400 hover:text-[#1a2744] font-[family-name:var(--font-inter)] transition-colors pt-1"
            >
              Esqueci minha senha
            </button>
          </form>
        )}

        {/* === VIEW: ESQUECI MINHA SENHA === */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="px-6 py-6 space-y-4">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-inter)] leading-relaxed">
              Digite o e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="block text-xs font-medium text-gray-500 font-[family-name:var(--font-inter)] uppercase tracking-wider"
              >
                E-mail
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="lider@exemplo.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-[family-name:var(--font-inter)] text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1a2744] hover:bg-[#253660] disabled:opacity-60 text-white text-sm font-medium font-[family-name:var(--font-inter)] py-2.5 rounded-xl transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              Enviar link de recuperação
            </button>
          </form>
        )}

        {/* === VIEW: EMAIL ENVIADO === */}
        {view === 'forgot-sent' && (
          <div className="px-6 py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail size={22} className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-800 font-[family-name:var(--font-inter)]">
              E-mail enviado!
            </p>
            <p className="text-xs text-gray-500 font-[family-name:var(--font-inter)] leading-relaxed">
              Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para criar uma nova senha.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 text-xs text-[#1a2744] hover:underline font-[family-name:var(--font-inter)]"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Borda dourada inferior */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#b8972a] to-transparent" />
      </div>
    </div>
  )
}
