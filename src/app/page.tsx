'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { UserPlus, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Missionary, MissionaryStatus, SortOption } from '@/types/missionary'
import { getMissionaryStatus } from '@/lib/missionary-status'
import Header from '@/components/Header'
import MissionaryCard from '@/components/MissionaryCard'
import type { ModalSavedAction } from '@/components/MissionaryModal'
const MissionaryModal = dynamic(() => import('@/components/MissionaryModal'))
import dynamic from 'next/dynamic'
import StatusCounter from '@/components/StatusCounter'
import SortBar from '@/components/SortBar'
import Toast, { ToastType } from '@/components/Toast'
import { useAuth } from '@/contexts/AuthContext'
import MissionaryCardSkeleton from '@/components/MissionaryCardSkeleton'

const MissionaryDetails = dynamic(() => import('@/components/MissionaryDetails'), { ssr: false })
const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

const STATUS_ORDER: Record<string, number> = {
  a_caminho: 0,
  em_campo: 1,
  retornou: 2,
  indefinido: 3,
}

function sortMissionaries(list: Missionary[], sort: SortOption): Missionary[] {
  const copy = [...list]
  switch (sort) {
    case 'nome':
      return copy.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    case 'ala':
      return copy.sort((a, b) => a.ala.localeCompare(b.ala, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'))
    case 'status':
      return copy.sort((a, b) => {
        const sa = STATUS_ORDER[getMissionaryStatus(a)]
        const sb = STATUS_ORDER[getMissionaryStatus(b)]
        return sa - sb || a.nome.localeCompare(b.nome, 'pt-BR')
      })
    case 'cronologico':
    default:
      return copy.sort((a, b) => {
        const da = a.data_inicio ?? ''
        const db = b.data_inicio ?? ''
        if (!da && !db) return a.nome.localeCompare(b.nome, 'pt-BR')
        if (!da) return 1
        if (!db) return -1
        return da.localeCompare(db)
      })
  }
}

export default function Page() {
  const { user } = useAuth()
  const isAdmin = !!user

  const [missionaries, setMissionaries] = useState<Missionary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('cronologico')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Missionary | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsMissionary, setDetailsMissionary] = useState<Missionary | null>(null)
  const [search, setSearch] = useState('')
  const [filterAla, setFilterAla] = useState('')
  const [filterStatus, setFilterStatus] = useState<MissionaryStatus | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [showMap, setShowMap] = useState(false)

  const fetchMissionaries = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('missionaries')
      .select('*')
    if (error) {
      setError('Erro ao carregar missionários.')
      setToast({ message: 'Erro ao carregar missionários. Tente novamente.', type: 'error' })
    } else {
      setMissionaries(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMissionaries()
  }, [fetchMissionaries])

  function openNew() {
    setSelected(null)
    setModalOpen(true)
  }

  function openDetails(missionary: Missionary) {
    setDetailsMissionary(missionary)
    setDetailsOpen(true)
  }

  function openEdit(missionary: Missionary) {
    setDetailsOpen(false)
    setDetailsMissionary(null)
    setSelected(missionary)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelected(null)
  }

  function closeDetails() {
    setDetailsOpen(false)
    setDetailsMissionary(null)
  }

  const alas = useMemo(() => {
    const set = new Set(missionaries.map((m) => m.ala))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [missionaries])

  const sorted = useMemo(() => {
    let list = sortMissionaries(missionaries, sort)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((m) => m.nome.toLowerCase().includes(q))
    }
    if (filterAla) {
      list = list.filter((m) => m.ala === filterAla)
    }
    if (filterStatus) {
      list = list.filter((m) => getMissionaryStatus(m) === filterStatus)

      if (filterStatus === 'em_campo') {
        // Mais próximos de retornar primeiro (data_termino ascendente)
        list = [...list].sort((a, b) => {
          if (!a.data_termino && !b.data_termino) return 0
          if (!a.data_termino) return 1
          if (!b.data_termino) return -1
          return a.data_termino.localeCompare(b.data_termino)
        })
      } else if (filterStatus === 'retornou') {
        // Retornaram mais recentemente primeiro (data_termino descendente)
        list = [...list].sort((a, b) => {
          if (!a.data_termino && !b.data_termino) return 0
          if (!a.data_termino) return 1
          if (!b.data_termino) return -1
          return b.data_termino.localeCompare(a.data_termino)
        })
      }
    }
    return list
  }, [missionaries, sort, search, filterAla, filterStatus])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Banner inspiracional */}
        <div
          className="rounded-2xl overflow-hidden relative shadow-lg"
          style={{
            height: 170,
            backgroundImage: `
              linear-gradient(rgba(26,39,68,0.45), rgba(26,39,68,0.72)),
              url('https://news-sg.churchofjesuschrist.org/media/960x720/christus-jesus-christ-mormon.jpg')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center 12%',
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
            <p
              className="text-[#f0d97a] text-xl sm:text-2xl font-bold drop-shadow-md"
              style={{ fontFamily: 'var(--font-playfair)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
            >
              "Ide por todo o mundo e pregai o evangelho"
            </p>
            <p className="text-gray-300 text-xs font-[family-name:var(--font-inter)] tracking-widest uppercase mt-1 drop-shadow">
              Marcos 16:15
            </p>
          </div>
        </div>

        {/* Divisor ornamental */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #b8972a)' }} />
          <svg width="32" height="14" viewBox="0 0 32 14" fill="none">
            <polygon points="16,0 32,7 16,14 0,7" fill="#b8972a" opacity="0.5" />
            <polygon points="16,3 29,7 16,11 3,7" fill="#b8972a" opacity="0.35" />
            <circle cx="16" cy="7" r="2.5" fill="#b8972a" opacity="0.7" />
          </svg>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #b8972a)' }} />
        </div>

        {/* Contadores de status */}
        {!loading && !error && (
          <StatusCounter
            missionaries={missionaries}
            filterStatus={filterStatus}
            onFilterStatus={setFilterStatus}
          />
        )}

        {/* Mapa mundi */}
        {!loading && !error && showMap && (
          <WorldMap missionaries={missionaries} filterStatus={filterStatus} />
        )}

        {/* Busca e filtro por ala */}
        {!loading && !error && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-full font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={filterAla}
              onChange={(e) => setFilterAla(e.target.value)}
              className="sm:w-52 px-4 py-2.5 text-sm border border-gray-200 rounded-full font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors text-gray-600 bg-white"
            >
              <option value="">Todas as alas</option>
              {alas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <SortBar current={sort} onChange={setSort} />
            <button
              onClick={() => setShowMap((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-[family-name:var(--font-inter)] transition-colors ${
                showMap
                  ? 'bg-[#1a2744] text-white border-[#1a2744]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a2744] hover:text-[#1a2744]'
              }`}
            >
              🌍 Mapa mundi
            </button>
          </div>
          {isAdmin && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#253660] text-white text-sm font-[family-name:var(--font-inter)] font-medium px-4 py-2.5 rounded-full transition-colors self-start sm:self-auto"
            >
              <UserPlus size={16} />
              Novo missionário
            </button>
          )}
        </div>

        {/* Skeleton loader */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <MissionaryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500 font-[family-name:var(--font-inter)] text-sm">
            {error}
            <button
              onClick={fetchMissionaries}
              className="block mx-auto mt-3 underline text-[#1a2744]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Grid de cards */}
        {!loading && !error && sorted.length === 0 && (
          <div className="text-center py-24 text-gray-400 font-[family-name:var(--font-inter)] text-sm">
            {search || filterAla || filterStatus
              ? 'Nenhum missionário encontrado para os filtros aplicados.'
              : 'Nenhum missionário cadastrado ainda.'}
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map((m, i) => (
              <MissionaryCard key={m.id} missionary={m} onClick={openDetails} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* Modal de detalhes */}
      {detailsOpen && detailsMissionary && (
        <MissionaryDetails
          missionary={detailsMissionary}
          onClose={closeDetails}
          onEdit={openEdit}
          isAdmin={isAdmin}
        />
      )}

      {/* Modal de cadastro / edição */}
      {modalOpen && (
        <MissionaryModal
          missionary={selected}
          onClose={closeModal}
          onSaved={(action: ModalSavedAction) => {
            fetchMissionaries()
            const messages: Record<ModalSavedAction, { message: string; type: ToastType }> = {
              created: { message: 'Missionário cadastrado com sucesso', type: 'saved' },
              updated: { message: 'Alterações salvas com sucesso', type: 'saved' },
              deleted: { message: 'Missionário excluído', type: 'deleted' },
            }
            setToast(messages[action])
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
