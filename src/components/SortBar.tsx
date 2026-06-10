'use client'

import { SortOption } from '@/types/missionary'

interface SortBarProps {
  current: SortOption
  onChange: (sort: SortOption) => void
}

const options: { value: SortOption; label: string }[] = [
  { value: 'cronologico', label: 'Cronológico' },
  { value: 'nome', label: 'Nome' },
  { value: 'ala', label: 'Ala' },
  { value: 'status', label: 'Status' },
]

export default function SortBar({ current, onChange }: SortBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 font-[family-name:var(--font-inter)] mr-1">Ordenar:</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs px-3 py-1.5 rounded-full border font-[family-name:var(--font-inter)] transition-colors ${
            current === opt.value
              ? 'bg-[#1a2744] text-white border-[#1a2744]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a2744] hover:text-[#1a2744]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
