import { createFileRoute, redirect } from '@tanstack/react-router'
import { syncAuthFromSession } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/sign-in' })
    }
    await syncAuthFromSession()
  },
  component: AuthenticatedLayout,
})
