import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'
import { scrollToElement } from '../utils/navigation'
import { AdminDashboard } from '../components/dashboard/AdminDashboard'
import { EmployeeDashboard } from '../components/dashboard/EmployeeDashboard'
import { HrDashboard } from '../components/dashboard/HrDashboard'
import { ManagerDashboard } from '../components/dashboard/ManagerDashboard'
import { DashboardSkeleton, ErrorState } from '../components/dashboard/ui'

const DASHBOARDS = {
  admin: AdminDashboard,
  hr: HrDashboard,
  manager: ManagerDashboard,
  employee: EmployeeDashboard,
}

export default function Dashboard() {
  const { user } = useAuth()
  const [rangeDays, setRangeDays] = useState(30)
  const [searchParams] = useSearchParams()
  const { data, loading, error, refresh, retry } = useDashboardData(
    user,
    rangeDays,
  )
  const focus = searchParams.get('focus')

  useEffect(() => {
    if (!data || !focus) {
      return undefined
    }

    const timer = setTimeout(() => {
      scrollToElement(focus)
    }, 120)

    return () => clearTimeout(timer)
  }, [data, focus])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState message={error} onRetry={retry} />
      </div>
    )
  }

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  const DashboardComponent = DASHBOARDS[data.roleKey]

  if (!DashboardComponent) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState message="This role does not have a dashboard configured." />
      </div>
    )
  }

  return (
    <DashboardComponent
      data={data}
      user={user}
      rangeDays={rangeDays}
      onRangeChange={setRangeDays}
      onRefresh={refresh}
      refreshing={loading}
    />
  )
}
