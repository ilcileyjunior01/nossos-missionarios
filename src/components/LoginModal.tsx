'use client'

import { useState } from 'react'
import { X, Loader2, LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #1a2744 0%, #253660 100%)',
          }}
        >
          <div>
            <h2
              className="text-white text-lg font-bold"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Acesso de Líder
            </h2>
            <p className="text-[#f0d97a]/70 text-xs mt-0.5 font-[family-name:var(--font-inter)]">
              Estaca SP BR Taboão
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
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
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <LogIn size={15} />
            )}
            Entrar
          </button>
        </form>

        {/* Borda dourada inferior */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#b8972a] to-transparent" />
      </div>
    </div>
  )
}
