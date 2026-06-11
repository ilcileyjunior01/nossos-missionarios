'use client'

import Image from 'next/image'
import { Missionary } from '@/types/missionary'
import { getMissionaryStatus, getMissionaryTimeLabel, isReturningSoon, getDaysUntilReturn, getMissionProgress } from '@/lib/missionary-status'
import StatusBadge from './StatusBadge'
import { UserCircle, MapPin } from 'lucide-react'

interface MissionaryCardProps {
  missionary: Missionary
  onClick: (missionary: Missionary) => void
}

export default function MissionaryCard({ missionary, onClick }: MissionaryCardProps) {
  const status = getMissionaryStatus(missionary)
  const timeLabel = getMissionaryTimeLabel(missionary, status)
  const returningSoon = isReturningSoon(missionary)
  const daysUntilReturn = getDaysUntilReturn(missionary)
  const progress = status === 'em_campo' ? getMissionProgress(missionary) : null

  function returnBannerLabel(): string {
    if (daysUntilReturn === null) return 'Retornando em breve'
    if (daysUntilReturn === 0) return 'Retorna hoje!'
    if (daysUntilReturn === 1) return 'Retorna amanhã!'
    return `Retorna em ${daysUntilReturn} dias`
  }

  const bannerUrgent = daysUntilReturn !== null && daysUntilReturn <= 7

  return (
    <div
      onClick={() => onClick(missionary)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Foto */}
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        {missionary.foto_url ? (
          <Image
            src={missionary.foto_url}
            alt={`Foto de ${missionary.nome}`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <UserCircle size={64} />
          </div>
        )}
        {/* Barra de progresso da missão */}
        {progress !== null && !returningSoon && (
          <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-black/30 backdrop-blur-sm">
            <div
              className="h-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #92700a, #b8972a, #f0d97a)',
                boxShadow: '0 0 8px rgba(184, 151, 42, 0.8)',
              }}
            >
              {/* efeito de brilho animado */}
              <span
                className="absolute inset-0 opacity-40"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>
          </div>
        )}

        {returningSoon && (
          <div className={`absolute bottom-0 left-0 right-0 text-white text-[11px] font-semibold text-center py-1 tracking-wide font-[family-name:var(--font-inter)] ${bannerUrgent ? 'bg-red-500' : 'bg-amber-500'}`}>
            {returnBannerLabel()}
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3
          className="text-sm font-semibold text-[#1a2744] leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {missionary.genero && (
            <span className="text-[#b8972a]">
              {missionary.genero === 'F' ? 'Sister' : 'Elder'}{' '}
            </span>
          )}
          {missionary.nome}
        </h3>

        <p className="text-xs text-gray-500 font-[family-name:var(--font-inter)] truncate">
          {missionary.ala}
        </p>

        {(missionary.pais_missao || missionary.nome_missao) && (
          <div className="flex items-start gap-1 mt-0.5">
            <MapPin size={11} className="text-[#b8972a] shrink-0 mt-0.5" />
            <div className="min-w-0">
              {missionary.nome_missao && (
                <p className="text-xs text-gray-600 font-[family-name:var(--font-inter)] truncate leading-tight">
                  {missionary.nome_missao}
                </p>
              )}
              {missionary.pais_missao && (
                <p className="text-xs text-gray-400 font-[family-name:var(--font-inter)] truncate leading-tight">
                  {missionary.pais_missao}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-1">
          <StatusBadge status={status} />
        </div>

        {timeLabel && (
          <p className="text-xs text-[#b8972a] font-medium font-[family-name:var(--font-inter)] mt-0.5">
            {timeLabel}
          </p>
        )}
      </div>

      {/* Borda dourada inferior */}
      <div className="h-0.5 bg-[#b8972a] opacity-40" />
    </div>
  )
}
