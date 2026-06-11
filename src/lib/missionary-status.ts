import { MissionaryStatus, Missionary } from '@/types/missionary'

export function getMissionaryStatus(missionary: Missionary): MissionaryStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const inicio = missionary.data_inicio ? new Date(missionary.data_inicio) : null
  const termino = missionary.data_termino ? new Date(missionary.data_termino) : null

  if (!inicio) return 'a_caminho'
  if (today < inicio) return 'a_caminho'
  if (termino && today > termino) return 'retornou'
  return 'em_campo'
}

export function getStatusLabel(status: MissionaryStatus): string {
  const labels: Record<MissionaryStatus, string> = {
    a_caminho: 'A caminho',
    em_campo: 'Em campo',
    retornou: 'Retornou',
    indefinido: 'Indefinido',
  }
  return labels[status]
}

export function getStatusColor(status: MissionaryStatus): string {
  const colors: Record<MissionaryStatus, string> = {
    a_caminho: 'bg-amber-100 text-amber-800 border-amber-300',
    em_campo: 'bg-green-100 text-green-800 border-green-300',
    retornou: 'bg-gray-100 text-gray-600 border-gray-300',
    indefinido: 'bg-slate-100 text-slate-500 border-slate-300',
  }
  return colors[status]
}

export function isReturningSoon(missionary: Missionary): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (!missionary.data_termino) return false
  const termino = new Date(missionary.data_termino)
  const diffDays = Math.round((termino.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 31
}

export function getDaysUntilReturn(missionary: Missionary): number | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (!missionary.data_termino) return null
  const termino = new Date(missionary.data_termino)
  const diffDays = Math.round((termino.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 ? diffDays : null
}

/** Progresso da missão de 0 a 100. Null se não houver datas suficientes. */
export function getMissionProgress(missionary: Missionary): number | null {
  if (!missionary.data_inicio || !missionary.data_termino) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inicio = new Date(missionary.data_inicio)
  const termino = new Date(missionary.data_termino)
  const total = termino.getTime() - inicio.getTime()
  if (total <= 0) return null
  const elapsed = today.getTime() - inicio.getTime()
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

export function getMissionaryTimeLabel(missionary: Missionary, status: MissionaryStatus): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffDays = (a: Date, b: Date) =>
    Math.round(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))

  if (status === 'a_caminho' && missionary.data_inicio) {
    const dias = diffDays(new Date(missionary.data_inicio), today)
    return `Parte em ${dias} dia${dias !== 1 ? 's' : ''}`
  }
  if (status === 'em_campo' && missionary.data_termino) {
    const dias = diffDays(new Date(missionary.data_termino), today)
    return `Retorna em ${dias} dia${dias !== 1 ? 's' : ''}`
  }
  if (status === 'retornou' && missionary.data_termino) {
    const dias = diffDays(today, new Date(missionary.data_termino))
    return `Retornou há ${dias} dia${dias !== 1 ? 's' : ''}`
  }
  return ''
}
