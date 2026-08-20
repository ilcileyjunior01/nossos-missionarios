'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Status = 'waiting' | 'ready' | 'success' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('waiting')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // O Supabase processa o hash da URL automaticamente e emite PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready')
      }
    })

    // Timeout: se não receber o evento em 5s, o link é inválido/expirado
    const timeout = setTimeout(() => {
      setStatus((s) => s === 'waiting' ? 'invalid' : s)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError('Erro ao atualizar a senha. Tente solicitar um novo link.')
    } else {
      setStatus('success')
      setTimeout(() => router.push('/'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Cabeçalho */}
        <div
          className="px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #1a2744 0%, #253660 100%)' }}
        >
          <h1
            className="text-white text-lg font-bold"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Nova Senha
          </h1>
          <p className="text-[#f0d97a]/70 text-xs mt-0.5 font-[family-name:var(--font-inter)]">
            Estaca SP BR Taboão
          </p>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-6">

          {/* Aguardando validação do link */}
          {status === 'waiting' && (
            <div className="text-center space-y-3 py-4">
              <Loader2 size={32} className="animate-spin text-[#1a2744] mx-auto" />
              <p className="text-sm text-gray-500 font-[family-name:var(--font-inter)]">
                Validando link de recuperação...
              </p>
            </div>
          )}

          {/* Link inválido ou expirado */}
          {status === 'invalid' && (
            <div className="text-center space-y-3 py-4">
              <XCircle size={36} className="text-red-400 mx-auto" />
              <p className="text-sm font-medium text-gray-800 font-[family-name:var(--font-inter)]">
                Link inválido ou expirado
              </p>
              <p className="text-xs text-gray-500 font-[family-name:var(--font-inter)] leading-relaxed">
                Acesse o app, clique em &ldquo;Esqueci minha senha&rdquo; e solicite um novo link.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-2 text-xs text-[#1a2744] hover:underline font-[family-name:var(--font-inter)]"
              >
                Ir para o início
              </button>
            </div>
          )}

          {/* Formulário de nova senha */}
          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-medium text-gray-500 font-[family-name:var(--font-inter)] uppercase tracking-wider"
                >
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
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

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-medium text-gray-500 font-[family-name:var(--font-inter)] uppercase tracking-wider"
                >
                  Confirmar senha
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repita a senha"
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
                {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                Salvar nova senha
              </button>
            </form>
          )}

          {/* Sucesso */}
          {status === 'success' && (
            <div className="text-center space-y-3 py-4">
              <CheckCircle size={36} className="text-green-500 mx-auto" />
              <p className="text-sm font-medium text-gray-800 font-[family-name:var(--font-inter)]">
                Senha atualizada com sucesso!
              </p>
              <p className="text-xs text-gray-500 font-[family-name:var(--font-inter)]">
                Redirecionando para o início...
              </p>
            </div>
          )}
        </div>

        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#b8972a] to-transparent" />
      </div>
    </div>
  )
}
