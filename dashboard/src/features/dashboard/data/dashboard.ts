import { useQuery } from '@tanstack/react-query'
import { supabase, PRODUCT_ID } from '@/lib/supabase'
import { statuses } from '@/features/tasks/data/data'

export interface DashboardRecord {
  id: string
  title: string
  status: string
  created_at: string
}

export interface UpcomingRecord {
  id: string
  title: string
  status: string
  due_date: string
}

export interface DashboardStats {
  total: number
  needsAttention: number
  addedThisWeek: number
  statusCounts: { status: string; count: number }[]
  recent: DashboardRecord[]
  upcomingExpirations: UpcomingRecord[]
}

// Derived automatically from statuses with severity='critical' in data.tsx.
// No manual update needed — just set severity correctly per status there.
const ATTENTION_STATUSES = statuses
  .filter((s) => s.severity === 'critical')
  .map((s) => s.value.toLowerCase())

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('records')
    .select('id, title, status, created_at')
    .eq('product_id', PRODUCT_ID)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const statusMap = new Map<string, number>()
  let needsAttention = 0
  let addedThisWeek = 0

  for (const row of rows) {
    const status = row.status ?? 'unknown'
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1)

    if (ATTENTION_STATUSES.includes(status.toLowerCase())) {
      needsAttention += 1
    }
    if (new Date(row.created_at) >= weekAgo) {
      addedThisWeek += 1
    }
  }

  // Fetch records with due_date in next 90 days, sorted soonest first
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: upcomingData } = await supabase
    .from('records')
    .select('id, title, status, due_date')
    .eq('product_id', PRODUCT_ID)
    .not('due_date', 'is', null)
    .gte('due_date', now.toISOString())
    .lte('due_date', in90Days)
    .order('due_date', { ascending: true })
    .limit(10)

  return {
    total: rows.length,
    needsAttention,
    addedThisWeek,
    statusCounts: Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    recent: rows.slice(0, 5).map((row) => ({
      id: String(row.id),
      title: row.title,
      status: row.status,
      created_at: row.created_at,
    })),
    upcomingExpirations: (upcomingData ?? []).map((row) => ({
      id: String(row.id),
      title: row.title,
      status: row.status,
      due_date: row.due_date,
    })),
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats', PRODUCT_ID],
    queryFn: fetchDashboardStats,
  })
}
