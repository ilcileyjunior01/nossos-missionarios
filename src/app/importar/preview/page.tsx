'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Missionary } from '@/types/missionary'

/** "Cavalcante, Beatriz Silva" → "Beatriz Silva Cavalcante" */
function normalizeName(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  let parts: string[]
  if (s.includes(',')) {
    const ci = s.indexOf(',')
    const last  = s.slice(0, ci).trim()
    const first = s.slice(ci + 1).trim()
    parts = [...first.split(/\s+/), ...last.split(/\s+/)]
  } else {
    parts = s.split(/\s+/)
  }
  return parts
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

interface LcrRecord {
  nome: string
  ala: string
  genero: 'M' | 'F' | null
  data_inicio: string | null
  data_termino: string | null
  nome_missao: string | null
  pais_missao: string | null
  cidade_missao: string | null
  eh_servico: boolean
  foto_url: null
  latitude: null
  longitude: null
  status_placa: 'nao_enviado'
}

type RowStatus = 'novo' | 'existente'

interface PreviewRow {
  record: LcrRecord
  status: RowStatus
  existingId?: string
}

export default function ImportarPreviewPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [rows, setRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState<{ inserted: number } | null>(null)
  const [showServico, setShowServico] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/')
  }, [user, authLoading, router])

  const prepare = useCallback(async () => {
    const raw = searchParams.get('data')
    if (!raw) {
      setError('Nenhum dado recebido. Execute o bookmarklet na página do LCR.')
      setLoading(false)
      return
    }

    let records: LcrRecord[]
    try {
      records = JSON.parse(decodeURIComponent(escape(atob(raw))))
    } catch {
      setError('Dados inválidos ou corrompidos.')
      setLoading(false)
      return
    }

    // Garante normalização independente do bookmarklet
    records = records.map((r) => ({
      ...r,
      nome: normalizeName(r.nome),
      ala: (r.ala || '').replace(/^(ala|ramo)\s+/i, '').trim(),
    }))

    if (!records.length) {
      setError('Nenhum missionário encontrado nos dados recebidos.')
      setLoading(false)
      return
    }

    // Busca existentes no Supabase (sem CSP, estamos no nosso domínio)
    const { data: existing, error: sbErr } = await supabase
      .from('missionaries')
      .select('id, nome')

    if (sbErr) {
      setError('Erro ao verificar registros existentes: ' + sbErr.message)
      setLoading(false)
      return
    }

    const existingMap = new Map<string, string>(
      (existing as Pick<Missionary, 'id' | 'nome'>[]).map((m) => [
        m.nome.toLowerCase().trim(),
        m.id,
      ])
    )

    const preview: PreviewRow[] = records.map((record) => {
      const key = record.nome.toLowerCase().trim()
      const existingId = existingMap.get(key)
      return {
        record,
        status: existingId ? 'existente' : 'novo',
        existingId,
      }
    })

    setRows(preview)
    setLoading(false)
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && user) prepare()
  }, [authLoading, user, prepare])

  async function handleImport() {
    const toInsert = visibleRows
      .filter((r) => r.status === 'novo')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ record: { eh_servico, ...rest } }) => rest)

    if (!toInsert.length) return

    setImporting(true)
    const { error: sbErr } = await supabase
      .from('missionaries')
      .insert(toInsert)

    setImporting(false)

    if (sbErr) {
      setError('Erro ao inserir: ' + sbErr.message)
      return
    }

    setDone({ inserted: toInsert.length })
  }

  const visibleRows = rows.filter((r) => showServico || !r.record.eh_servico)
  const servicoCount = rows.filter((r) => r.record.eh_servico).length
  const newCount  = visibleRows.filter((r) => r.status === 'novo').length
  const skipCount = visibleRows.filter((r) => r.status === 'existente').length

  // ── Loading / auth ──
  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center gap-3 text-gray-500 font-[family-name:var(--font-inter)] text-sm">
          <div className="w-5 h-5 rounded-full border-2 border-[#1a2744] border-t-transparent animate-spin" />
          Verificando registros existentes…
        </div>
      </div>
    )
  }

  // ── Erro ──
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center font-[family-name:var(--font-inter)]">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => router.push('/importar')}
            className="text-sm text-[#1a2744] underline"
          >
            ← Voltar para Importar LCR
          </button>
        </div>
      </div>
    )
  }

  // ── Concluído ──
  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 text-center font-[family-name:var(--font-inter)]">
          <div className="text-5xl">✅</div>
          <div>
            <p className="text-xl font-semibold text-[#1a2744]">
              {done.inserted} missionário(s) importado(s)!
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Lembre de rodar o script de geocodificação para preencher o mapa.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="bg-[#1a2744] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#253660] transition-colors"
            >
              Ver painel
            </button>
            <button
              onClick={() => router.push('/importar')}
              className="text-sm text-gray-500 underline"
            >
              Importar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Preview ──
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 font-[family-name:var(--font-inter)]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-[#1a2744]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Preview da importação
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {rows.length} encontrados no LCR &nbsp;·&nbsp;
              <span className="text-green-700 font-medium">{newCount} novos</span>
              &nbsp;·&nbsp;
              <span className="text-amber-700 font-medium">{skipCount} já cadastrados</span>
            </p>
          </div>
          {servicoCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showServico}
                onChange={(e) => setShowServico(e.target.checked)}
                className="w-4 h-4 accent-[#1a2744]"
              />
              Mostrar de serviço da Igreja ({servicoCount})
            </label>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600 border-b border-gray-200">Nome</th>
                  <th className="px-4 py-3 font-medium text-gray-600 border-b border-gray-200">Ala</th>
                  <th className="px-4 py-3 font-medium text-gray-600 border-b border-gray-200">Missão</th>
                  <th className="px-4 py-3 font-medium text-gray-600 border-b border-gray-200">Início</th>
                  <th className="px-4 py-3 font-medium text-gray-600 border-b border-gray-200">Retorno</th>
                  <th className="px-4 py-3 font-medium text-gray-600 border-b border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr
                    key={i}
                    className={row.status === 'novo' ? 'bg-green-50' : 'bg-amber-50'}
                  >
                    <td className={`px-4 py-3 border-b border-gray-100 font-medium ${row.status === 'novo' ? 'text-green-900' : 'text-amber-900'}`}>
                      {row.record.nome}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                      {row.record.ala || '—'}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700 max-w-[200px]">
                      {row.record.nome_missao || '—'}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                      {row.record.data_inicio || '—'}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                      {row.record.data_termino || '—'}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-semibold">
                      {row.status === 'novo'
                        ? <span className="text-green-700">✅ Novo</span>
                        : <span className="text-amber-700">⚠️ Já existe</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/importar')}
            className="text-sm text-gray-500 hover:text-[#1a2744] underline transition-colors"
          >
            ← Cancelar
          </button>

          <button
            onClick={handleImport}
            disabled={newCount === 0 || importing}
            className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#253660] disabled:bg-gray-300 text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors"
          >
            {importing && (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {newCount === 0
              ? 'Nenhum novo para importar'
              : importing
                ? 'Importando…'
                : `Importar ${newCount} novo(s)`
            }
          </button>
        </div>
      </main>
    </div>
  )
}
