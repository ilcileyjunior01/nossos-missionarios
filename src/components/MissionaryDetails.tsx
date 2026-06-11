'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Pencil, UserCircle, Calendar, MapPin, Flag, Award } from 'lucide-react'
import { Missionary } from '@/types/missionary'
import { getMissionaryStatus, getMissionaryTimeLabel } from '@/lib/missionary-status'
import StatusBadge from './StatusBadge'
import MissionaryMap from './MissionaryMap'
import PlaquetaPreview from './PlaquetaPreview'

interface MissionaryDetailsProps {
  missionary: Missionary
  onClose: () => void
  onEdit: (missionary: Missionary) => void
  isAdmin?: boolean
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export default function MissionaryDetails({ missionary, onClose, onEdit, isAdmin = false }: MissionaryDetailsProps) {
  const status = getMissionaryStatus(missionary)
  const timeLabel = getMissionaryTimeLabel(missionary, status)
  const [showPlaqueta, setShowPlaqueta] = useState(false)

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2
            className="text-lg font-bold text-[#1a2744]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Detalhes
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-5 flex gap-5">

          {/* Foto */}
          <div className="shrink-0 w-28 h-36 rounded-xl overflow-hidden bg-gray-100 relative">
            {missionary.foto_url ? (
              <Image
                src={missionary.foto_url}
                alt={`Foto de ${missionary.nome}`}
                fill
                className="object-cover object-top"
                sizes="112px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <UserCircle size={48} />
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <h3
              className="text-xl font-bold text-[#1a2744] leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {missionary.genero && (
                <span className="text-[#b8972a]">
                  {missionary.genero === 'F' ? 'Sister' : 'Elder'}{' '}
                </span>
              )}
              {missionary.nome}
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={status} />
              {timeLabel && (
                <span className="text-xs text-[#b8972a] font-medium font-[family-name:var(--font-inter)]">
                  {timeLabel}
                </span>
              )}
            </div>

            <div className="mt-1 space-y-1.5">
              <InfoRow icon={<Flag size={13} />} label="Ala" value={missionary.ala} />
              <InfoRow
                icon={<Calendar size={13} />}
                label="Início"
                value={formatDate(missionary.data_inicio)}
              />
              <InfoRow
                icon={<Calendar size={13} />}
                label="Término"
                value={formatDate(missionary.data_termino)}
              />
              {missionary.pais_missao && (
                <InfoRow icon={<MapPin size={13} />} label="País" value={missionary.pais_missao} />
              )}
              {missionary.nome_missao && (
                <InfoRow icon={<MapPin size={13} />} label="Missão" value={missionary.nome_missao} />
              )}
            </div>
          </div>
        </div>

        {/* Mapa individual */}
        <div className="px-6 pb-2">
          <MissionaryMap missionary={missionary} />
        </div>

        {/* Barra dourada */}
        <div className="h-0.5 bg-[#b8972a] opacity-40 mx-6" />

        {/* Rodapé */}
        <div className="px-6 py-4 flex justify-between items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowPlaqueta(true)}
              className="flex items-center gap-2 border border-[#b8972a] text-[#b8972a] hover:bg-[#b8972a]/5 rounded-full px-4 py-2 text-sm font-[family-name:var(--font-inter)] transition-colors"
            >
              <Award size={14} />
              Prévia da placa
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="border border-gray-200 text-gray-600 rounded-full px-5 py-2 text-sm font-[family-name:var(--font-inter)] hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            {isAdmin && (
              <button
                onClick={() => onEdit(missionary)}
                className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#253660] text-white rounded-full px-5 py-2 text-sm font-[family-name:var(--font-inter)] font-medium transition-colors"
              >
                <Pencil size={14} />
                Editar
              </button>
            )}
          </div>
        </div>

      </div>
    </div>

    {isAdmin && showPlaqueta && (
      <PlaquetaPreview
        missionary={missionary}
        onClose={() => setShowPlaqueta(false)}
      />
    )}
  </>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-[family-name:var(--font-inter)]">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-700 font-medium truncate">{value}</span>
    </div>
  )
}
