import { MissionaryStatus } from '@/types/missionary'
import { getStatusLabel, getStatusColor } from '@/lib/missionary-status'

interface StatusBadgeProps {
  status: MissionaryStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border font-[family-name:var(--font-inter)] ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}
