
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import { useTasks } from './data/tasks'
import { RECORDS_LABEL, RECORDS_SUBTITLE } from '@/product-config'

export function Tasks() {
  const { data: tasks, isLoading, error } = useTasks()

  return (
    <TasksProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{RECORDS_LABEL}</h2>
            <p className='text-muted-foreground'>
              {RECORDS_SUBTITLE}
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>
        {isLoading && <p className='text-muted-foreground'>Loading...</p>}
        {error && (
          <p className='text-destructive'>Failed to load: {error.message}</p>
        )}
        {tasks && <TasksTable data={tasks} />}
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
