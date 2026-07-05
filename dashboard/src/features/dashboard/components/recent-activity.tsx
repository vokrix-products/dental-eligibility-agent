import { Badge } from '@/components/ui/badge'
import { statuses, severityToBadgeVariant } from '@/features/tasks/data/data'
import { useDashboardStats } from '../data/dashboard'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function RecentActivity() {
  const { data, isLoading } = useDashboardStats()

  if (isLoading) {
    return <div className='text-sm text-muted-foreground'>Loading...</div>
  }

  if (!data || data.recent.length === 0) {
    return <div className='text-sm text-muted-foreground'>No records yet.</div>
  }

  return (
    <div className='space-y-6'>
      {data.recent.map((record) => {
        const statusDef = statuses.find((s) => s.value === record.status)
        const severity = statusDef?.severity ?? 'neutral'
        const badgeVariant = severityToBadgeVariant[severity]
        return (
          <div
            key={record.id}
            className='flex items-center justify-between gap-4'
          >
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{record.title}</p>
              <p className='text-xs text-muted-foreground'>
                {formatDate(record.created_at)}
              </p>
            </div>
            <Badge variant={badgeVariant}>
              {statusDef?.label ?? record.status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
