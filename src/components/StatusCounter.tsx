'use client'

import { useEffect, useRef, useState } from 'react'
import { Missionary, MissionaryStatus } from '@/types/missionary'
import { getMissionaryStatus } from '@/lib/missionary-status'

interface StatusCounterProps {
  missionaries: Missionary[]
  filterStatus: MissionaryStatus | null
  onFilterStatus: (status: MissionaryStatus | null) => void
}

function useCountUp(target: number, duration = 550) {
  const [value, setValue] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(start + (target - start) * eased)
      setValue(next)
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = target
    }

    requestAnimationFrame(tick)
  }, [target, duration])

  return value
}

function CounterItem({
  label, status, target, color, bg, activeBg, isActive, onClick,
}: {
  label: string
  status: MissionaryStatus | null
  target: number
  color: string
  bg: string
  activeBg: string
  isActive: boolean
  onClick: () => void
}) {
  const displayed = useCountUp(target)

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 flex flex-col items-center transition-all duration-150 hover:scale-[1.02] hover:shadow-md ${
        isActive ? activeBg : bg
      }`}
    >
      <span
        className={`text-2xl font-bold tabular-nums ${isActive ? 'text-white' : color}`}
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {displayed}
      </span>
      <span className={`text-xs font-[family-name:var(--font-inter)] mt-0.5 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  )
}

export default function StatusCounter({ missionaries, filterStatus, onFilterStatus }: StatusCounterProps) {
  const counts = missionaries.reduce(
    (acc, m) => {
      const status = getMissionaryStatus(m)
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const items: {
    label: string
    status: MissionaryStatus | null
    count: number
    color: string
    bg: string
    activeBg: string
  }[] = [
    { label: 'Em campo',   status: 'em_campo',  count: counts['em_campo']  || 0, color: 'text-green-700', bg: 'bg-green-50 border-green-200',       activeBg: 'bg-green-600 border-green-600 text-white' },
    { label: 'A caminho',  status: 'a_caminho', count: counts['a_caminho'] || 0, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200',       activeBg: 'bg-amber-500 border-amber-500 text-white' },
    { label: 'Retornaram', status: 'retornou',  count: counts['retornou']  || 0, color: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200',         activeBg: 'bg-gray-500 border-gray-500 text-white' },
    { label: 'Total',      status: null,        count: missionaries.length,       color: 'text-[#1a2744]', bg: 'bg-[#1a2744]/5 border-[#1a2744]/20', activeBg: 'bg-[#1a2744] border-[#1a2744] text-white' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <CounterItem
          key={item.label}
          label={item.label}
          status={item.status}
          target={item.count}
          color={item.color}
          bg={item.bg}
          activeBg={item.activeBg}
          isActive={filterStatus === item.status}
          onClick={() => onFilterStatus(filterStatus === item.status ? null : item.status)}
        />
      ))}
    </div>
  )
}
