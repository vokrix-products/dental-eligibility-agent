import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { statuses } from '@/features/tasks/data/data'
import { useDashboardStats } from '../data/dashboard'

// Maps severity to a CSS variable color for the chart bars
function severityToFill(status: string): string {
  const def = statuses.find((s) => s.value === status)
  const severity = def?.severity ?? 'neutral'
  switch (severity) {
    case 'critical': return 'var(--color-destructive)'
    case 'warning':  return 'var(--color-warning)'
    case 'good':     return 'var(--color-success)'
    default:         return 'var(--color-muted-foreground)'
  }
}

export function Overview() {
  const { data, isLoading } = useDashboardStats()

  if (isLoading) {
    return <div className='text-sm text-muted-foreground'>Loading...</div>
  }

  if (!data || data.statusCounts.length === 0) {
    return <div className='text-sm text-muted-foreground'>No records yet.</div>
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data.statusCounts}>
        <XAxis
          dataKey='status'
          tickFormatter={(value) => {
            const def = statuses.find((s) => s.value === value)
            return def?.label ?? value
          }}
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Bar dataKey='count' radius={[4, 4, 0, 0]}>
          {data.statusCounts.map((entry) => (
            <Cell
              key={entry.status}
              fill={severityToFill(entry.status)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
