'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Trash2, AlertCircle, X } from 'lucide-react'

export type ToastType = 'saved' | 'deleted' | 'error'

interface ToastProps {
  message: string
  type: ToastType
  onDismiss: () => void
}

const CONFIG: Record<ToastType, { bg: string; Icon: React.ElementType }> = {
  saved:   { bg: 'bg-[#1a2744]',  Icon: CheckCircle  },
  deleted: { bg: 'bg-red-600',    Icon: Trash2       },
  error:   { bg: 'bg-rose-700',   Icon: AlertCircle  },
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show   = setTimeout(() => setVisible(true),   10)
    const hide   = setTimeout(() => setVisible(false), 2800)
    const remove = setTimeout(() => onDismiss(),        3200)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
      clearTimeout(remove)
    }
  }, [onDismiss])

  const { bg, Icon } = CONFIG[type]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 pl-5 pr-3 py-3
        rounded-2xl shadow-lg text-sm font-[family-name:var(--font-inter)] font-medium text-white
        transition-all duration-300 ${bg}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
    >
      <Icon size={16} className="shrink-0" />
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
        className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  )
}
