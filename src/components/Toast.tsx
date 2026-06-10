'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Trash2 } from 'lucide-react'

export type ToastType = 'saved' | 'deleted'

interface ToastProps {
  message: string
  type: ToastType
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Entra com animação
    const show = setTimeout(() => setVisible(true), 10)
    // Começa a sair após 2.8s
    const hide = setTimeout(() => setVisible(false), 2800)
    // Remove do DOM após a animação de saída
    const remove = setTimeout(() => onDismiss(), 3200)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
      clearTimeout(remove)
    }
  }, [onDismiss])

  const isDeleted = type === 'deleted'

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-[family-name:var(--font-inter)] font-medium transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${isDeleted ? 'bg-red-600 text-white' : 'bg-[#1a2744] text-white'}`}
    >
      {isDeleted ? <Trash2 size={16} /> : <CheckCircle size={16} />}
      {message}
    </div>
  )
}
