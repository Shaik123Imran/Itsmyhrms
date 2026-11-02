import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FolderKanban,
  Handshake,
  ListChecks,
  ListTodo,
  LogIn,
  LogOut,
  Megaphone,
  Timer,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import Modal from '../components/Modal'
import { formatClockTime, formatDate, isoOffset } from '../utils/date'
import { navigateTo } from '../utils/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'
import {
  approveLeave,
  approveTimesheet,
  rejectLeave,
  rejectTimesheet,
} from '../services/dashboardService'
import {
  checkIn,
  checkOut,
  completeTask,
  createTask,
  toggleOnboardingItem,
} from '../services/workspaceStore'
import { ActionCenter } from '../components/dashboard/ActionCenter'
import { ActivityTable } from '../components/dashboard/ActivityTable'
import { AnnouncementsCard } from '../components/dashboard/AnnouncementsCard'
import {
  AttendanceTrendChart,
  DepartmentPieChart,
  HoursBarChart,
  RecruitmentFunnelChart,
  WorkloadBarChart,
} from '../components/dashboard/charts'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { HolidaysCard } from '../components/dashboard/HolidaysCard'
import { InterviewsCard } from '../components/dashboard/InterviewsCard'
import { LeaveBalancesCard } from '../components/dashboard/LeaveBalancesCard'
import { MyAttendanceCard } from '../components/dashboard/MyAttendanceCard'
import { MyDay } from '../components/dashboard/MyDay'
import { OnboardingCard } from '../components/dashboard/OnboardingCard'
import { ProjectListCard } from '../components/dashboard/ProjectListCard'
import { TaskListCard } from '../components/dashboard/TaskListCard'
import { TodayAttendanceTable } from '../components/dashboard/TodayAttendanceTable'
import { WhosOutToday } from '../components/dashboard/WhosOutToday'
import {
  DashboardSkeleton,
  ErrorState,
  InlineNotice,
  KpiCard,
  QuickActions,
  SectionCard,
} from '../components/dashboard/ui'

const EMPTY_TASK_FORM = {
  title: '',
  project: 'Internal',
  assigneeId: '',
  priority: 'Medium',
  dueDate: isoOffset(3),
  description: '',
}

const SUBTITLES = {
  admin: 'A complete view of people, attendance, hiring, and delivery health.',
  hr: 'People operations, hiring, and onboarding in one place.',
  manager:
    "Your team's attendance, workload, approvals, and delivery health.",
  employee: 'Your attendance, tasks, leave, and timesheets at a glance.',
  finance: 'Workforce attendance, hours, and operational health at a glance.',
  sales: 'Client delivery, project health, and business activity in one place.',
  client: 'A clear view of your projects, delivery progress, and risk.',
}

function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    if (left.status === 'Completed' && right.status !== 'Completed') return 1
    if (left.status !== 'Completed' && right.status === 'Completed') return -1
    return String(left.dueDate).localeCompare(String(right.dueDate))
  })
}

function buildWeeklyHours(timesheets) {
  const hoursByDate = new Map()

  timesheets.forEach((entry) => {
    if (entry.dateISO >= isoOffset(-6)) {
      hoursByDate.set(
        entry.dateISO,
        (hoursByDate.get(entry.dateISO) ?? 0) + entry.hours,
      )
    }
  })

  return Array.from({ length: 7 }, (_, index) => {
    const date = isoOffset(-(6 - index))
    return {
      label: formatDate(date, { weekday: 'short' }),
      hours: Math.round((hoursByDate.get(date) ?? 0) * 10) / 10,
    }
  })
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rangeDays, setRangeDays] = useState(30)
  const [searchParams] = useSearchParams()
  const { data, loading, error, refresh, retry } = useDashboardData(
    user,
    rangeDays,
  )
  const focus = searchParams.get('focus')

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM)
  const [taskError, setTaskError] = useState('')
  const [notice, setNotice] = useState(null)

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

  const roleKey = data.roleKey
  const isAdmin = roleKey === 'admin'
  const isHr = roleKey === 'hr'
  const isManager = roleKey === 'manager'
  const isEmployee = roleKey === 'employee'
  const isFinance = roleKey === 'finance'
  const isSales = roleKey === 'sales'
  const isClient = roleKey === 'client'
  const isOrgWide = isAdmin || isHr

  const can = {
    approveRequests: isOrgWide || isManager,
    manageEmployees: isAdmin || isHr,
    viewRecruitment: isAdmin || isHr,
    viewOnboarding: isAdmin || isHr || isManager,
    viewOrgAnalytics: isOrgWide,
    viewTeam: isManager,
    viewProjects: isAdmin || isManager || isSales || isClient,
    viewFinance: isFinance,
    viewSales: isSales,
    viewClient: isClient,
    assignTasks: isManager,
    viewPersonal: isEmployee,
  }

  const metrics = data.metrics
  const attendance = metrics.attendance
  const todayRecord = data.attendance.todayRecord
  const checkedIn = Boolean(todayRecord?.checkIn)
  const checkedOut = Boolean(todayRecord?.checkOut)
  const activeProjects = data.projects.filter(
    (project) => project.status !== 'Completed',
  )
  const myDayDateLabel = formatDate(data.today, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const handleApproval = (item, action) => {
    if (!can.approveRequests) {
      return
    }

    if (item.kind === 'leave') {
      if (action === 'approve') approveLeave(item.entityId)
      else rejectLeave(item.entityId)
      return
    }

    if (item.kind === 'timesheet') {
      if (action === 'approve') approveTimesheet(item.entityId)
      else rejectTimesheet(item.entityId)
      return
    }

    navigateTo(navigate, item.link)
  }

  const handleCheckIn = () => {
    try {
      checkIn(user)
      setNotice({
        tone: 'success',
        message: 'Checked in. Have a productive day!',
      })
    } catch (error) {
      setNotice({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to check in right now.',
      })
    }
  }

  const handleCheckOut = () => {
    try {
      checkOut(user)
      setNotice({
        tone: 'success',
        message: 'Checked out. Your hours have been recorded.',
      })
    } catch (error) {
      setNotice({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to check out right now.',
      })
    }
  }

  const handleCompleteTask = (task) => {
    completeTask(task.id)
    setNotice({
      tone: 'success',
      message: `“${task.title}” marked as complete.`,
    })
  }

  const openTaskModal = () => {
    setTaskForm({
      ...EMPTY_TASK_FORM,
      assigneeId: data.employees[0]?.id ?? '',
      dueDate: isoOffset(3),
    })
    setTaskError('')
    setTaskModalOpen(true)
  }

  const handleCreateTask = (event) => {
    event.preventDefault()

    if (!taskForm.title.trim()) {
      setTaskError('Give the task a clear title.')
      return
    }

    if (!taskForm.assigneeId) {
      setTaskError('Choose a team member to assign the task to.')
      return
    }

    const assignee = data.employees.find(
      (member) => member.id === taskForm.assigneeId,
    )

    createTask({ ...taskForm, title: taskForm.title.trim() }, user)
    setTaskModalOpen(false)
    setNotice({
      tone: 'success',
      message: `Task assigned to ${assignee?.name ?? 'your team member'}.`,
    })
  }

  const kpis = []

  if (isAdmin) {
    kpis.push(
      {
        key: 'employees',
        label: 'Total employees',
        value: metrics.totalEmployees,
        detail: `${metrics.activeEmployees} active · ${metrics.newJoiners} new joiners`,
        icon: Users,
        accent: 'indigo',
        onClick: () => navigate('/employees'),
      },
      {
        key: 'attendance',
        label: 'Attendance today',
        value: `${attendance.working}/${attendance.total}`,
        detail: `${attendance.present} present · ${attendance.remote} remote · ${attendance.late} late`,
        icon: UserCheck,
        accent: 'emerald',
        trend: {
          label: `${attendance.presentRate}%`,
          positive: attendance.presentRate >= 75,
        },
        onClick: () => navigate('/attendance'),
      },
      {
        key: 'approvals',
        label: 'Pending approvals',
        value: metrics.approvals.total,
        detail: `${metrics.approvals.leave} leave · ${metrics.approvals.timesheet} timesheets`,
        icon: ClipboardCheck,
        accent: 'amber',
        onClick: () => navigateTo(navigate, '#action-center'),
      },
      {
        key: 'openings',
        label: 'Open positions',
        value: metrics.recruitment.openJobs,
        detail: `${metrics.recruitment.candidates} candidates · ${metrics.recruitment.interviews} interviews`,
        icon: Briefcase,
        accent: 'sky',
        onClick: () => navigate('/recruitment'),
      },
      {
        key: 'risk',
        label: 'Projects at risk',
        value: metrics.projects.atRisk,
        detail: `${metrics.projects.active} active · ${metrics.projects.averageProgress}% avg progress`,
        icon: FolderKanban,
        accent: 'rose',
        onClick: () => navigate('/projects'),
      },
    )
  } else if (isHr) {
    kpis.push(
      {
        key: 'employees',
        label: 'Total employees',
        value: metrics.totalEmployees,
        detail: `${metrics.activeEmployees} active · ${metrics.onLeaveEmployees} on leave`,
        icon: Users,
        accent: 'indigo',
        onClick: () => navigate('/employees'),
      },
      {
        key: 'attendance',
        label: 'Present today',
        value: `${attendance.working}/${attendance.total}`,
        detail: `${attendance.present} present · ${attendance.remote} remote · ${attendance.late} late`,
        icon: UserCheck,
        accent: 'emerald',
        trend: {
          label: `${attendance.presentRate}%`,
          positive: attendance.presentRate >= 75,
        },
        onClick: () => navigate('/attendance'),
      },
      {
        key: 'approvals',
        label: 'Pending approvals',
        value: metrics.approvals.total,
        detail: `${metrics.approvals.leave} leave · ${metrics.approvals.timesheet} timesheets`,
        icon: ClipboardCheck,
        accent: 'amber',
        onClick: () => navigateTo(navigate, '#action-center'),
      },
      {
        key: 'onboarding',
        label: 'Onboarding',
        value: metrics.onboarding.inProgress,
        detail: `${metrics.onboarding.completion}% complete · ${metrics.onboarding.pendingItems} items pending`,
        icon: UserCheck,
        accent: 'violet',
        onClick: () => navigateTo(navigate, '#onboarding'),
      },
      {
        key: 'openings',
        label: 'Open positions',
        value: metrics.recruitment.openJobs,
        detail: `${metrics.recruitment.candidates} candidates · ${metrics.recruitment.interviews} interviews`,
        icon: Briefcase,
        accent: 'sky',
        onClick: () => navigate('/recruitment'),
      },
    )
  } else if (isManager) {
    kpis.push(
      {
        key: 'team',
        label: 'Team members',
        value: metrics.totalEmployees,
        detail: `${metrics.activeEmployees} active · ${metrics.onLeaveEmployees} on leave`,
        icon: Users,
        accent: 'indigo',
        onClick: () => navigate('/employees'),
      },
      {
        key: 'attendance',
        label: 'Team attendance',
        value: `${attendance.working}/${attendance.total}`,
        detail: `${attendance.present} present · ${attendance.remote} remote · ${attendance.notMarked} not marked`,
        icon: UserCheck,
        accent: 'emerald',
        trend: {
          label: `${attendance.presentRate}%`,
          positive: attendance.presentRate >= 75,
        },
        onClick: () => navigate('/attendance'),
      },
      {
        key: 'approvals',
        label: 'Pending approvals',
        value: metrics.approvals.total,
        detail: `${metrics.approvals.leave} leave · ${metrics.approvals.timesheet} timesheets`,
        icon: ClipboardCheck,
        accent: 'amber',
        onClick: () => navigateTo(navigate, '#action-center'),
      },
      {
        key: 'tasks',
        label: 'Active tasks',
        value: metrics.tasks.total - metrics.tasks.completed,
        detail: `${metrics.tasks.overdue} overdue · ${metrics.tasks.dueSoon} due soon`,
        icon: ListTodo,
        accent: 'rose',
        onClick: () => navigateTo(navigate, '#team-tasks'),
      },
      {
        key: 'hours',
        label: 'Hours this week',
        value: `${metrics.timesheets.weekHours}h`,
        detail: `${metrics.timesheets.pending} pending · ${metrics.timesheets.completion}% approved`,
        icon: Clock,
        accent: 'sky',
        onClick: () => navigate('/timesheets'),
      },
    )
  } else if (isFinance) {
    kpis.push(
      {
        key: 'employees',
        label: 'Total employees',
        value: metrics.totalEmployees,
        detail: `${metrics.activeEmployees} active · ${metrics.departments} departments`,
        icon: Users,
        accent: 'indigo',
        onClick: () => navigate('/employees'),
      },
      {
        key: 'attendance',
        label: 'Present today',
        value: `${attendance.working}/${attendance.total}`,
        detail: `${attendance.present} present · ${attendance.remote} remote · ${attendance.late} late`,
        icon: UserCheck,
        accent: 'emerald',
        trend: {
          label: `${attendance.presentRate}%`,
          positive: attendance.presentRate >= 75,
        },
        onClick: () => navigate('/attendance'),
      },
      {
        key: 'hours',
        label: 'Hours this week',
        value: `${metrics.timesheets.weekHours}h`,
        detail: `${metrics.timesheets.pending} pending · ${metrics.timesheets.completion}% approved`,
        icon: Clock,
        accent: 'sky',
        onClick: () => navigate('/timesheets'),
      },
      {
        key: 'timesheets',
        label: 'Pending timesheets',
        value: metrics.timesheets.pending,
        detail: `${metrics.timesheets.draft} draft · ${metrics.timesheets.approved} approved`,
        icon: ClipboardList,
        accent: 'amber',
        onClick: () => navigate('/timesheets'),
      },
      {
        key: 'departments',
        label: 'Departments',
        value: metrics.departments,
        detail: `${metrics.branches} branches · ${metrics.newJoiners} new joiners`,
        icon: Building2,
        accent: 'violet',
        onClick: () => navigateTo(navigate, '#finance-overview'),
      },
    )
  } else if (isSales) {
    kpis.push(
      {
        key: 'active-projects',
        label: 'Active projects',
        value: metrics.projects.active,
        detail: `${metrics.projects.total} total · ${metrics.projects.completed} completed`,
        icon: FolderKanban,
        accent: 'indigo',
        onClick: () => navigate('/projects'),
      },
      {
        key: 'at-risk',
        label: 'Projects at risk',
        value: metrics.projects.atRisk,
        detail: 'Delivery needs attention',
        icon: AlertTriangle,
        accent: 'rose',
        onClick: () => navigate('/projects'),
      },
      {
        key: 'progress',
        label: 'Avg progress',
        value: `${metrics.projects.averageProgress}%`,
        detail: 'Across active portfolio',
        icon: TrendingUp,
        accent: 'emerald',
        onClick: () => navigate('/projects'),
      },
      {
        key: 'employees',
        label: 'People',
        value: metrics.totalEmployees,
        detail: `${metrics.activeEmployees} active · ${metrics.onLeaveEmployees} on leave`,
        icon: Users,
        accent: 'sky',
        onClick: () => navigate('/crm'),
      },
      {
        key: 'holidays',
        label: 'Upcoming holidays',
        value: data.holidays.length,
        detail: 'Company calendar',
        icon: CalendarDays,
        accent: 'amber',
        onClick: () => navigate('/reports'),
      },
    )
  } else if (isClient) {
    kpis.push(
      {
        key: 'active-projects',
        label: 'Active projects',
        value: metrics.projects.active,
        detail: `${metrics.projects.total} total in portfolio`,
        icon: FolderKanban,
        accent: 'indigo',
        onClick: () => navigate('/projects'),
      },
      {
        key: 'at-risk',
        label: 'Projects at risk',
        value: metrics.projects.atRisk,
        detail: 'Needs your attention',
        icon: AlertTriangle,
        accent: 'rose',
        onClick: () => navigate('/projects'),
      },
      {
        key: 'progress',
        label: 'Avg progress',
        value: `${metrics.projects.averageProgress}%`,
        detail: 'Across your portfolio',
        icon: TrendingUp,
        accent: 'emerald',
        onClick: () => navigate('/projects'),
      },
      {
        key: 'completed',
        label: 'Completed',
        value: metrics.projects.completed,
        detail: 'Delivered projects',
        icon: CalendarCheck,
        accent: 'violet',
        onClick: () => navigate('/projects'),
      },
      {
        key: 'total-projects',
        label: 'Total projects',
        value: metrics.projects.total,
        detail: 'In your portfolio',
        icon: Briefcase,
        accent: 'sky',
        onClick: () => navigate('/projects'),
      },
    )
  } else if (isEmployee) {
    const totalLeaveAvailable = data.leave.balances.reduce(
      (sum, balance) => sum + balance.available,
      0,
    )
    const status = todayRecord?.status ?? 'Not marked'
    const statusDetail = todayRecord?.checkIn
      ? `Checked in at ${formatClockTime(todayRecord.checkIn)}${
          todayRecord.checkOut
            ? ` · out at ${formatClockTime(todayRecord.checkOut)}`
            : ' · in progress'
        }`
      : 'No check-in yet today'

    kpis.push(
      {
        key: 'status',
        label: "Today's status",
        value: status,
        detail: statusDetail,
        icon: Clock,
        accent: 'emerald',
        onClick: () => navigate('/attendance'),
      },
      {
        key: 'month',
        label: 'This month',
        value: `${data.attendance.monthly.presentDays}/${data.attendance.monthly.workingDays}`,
        detail: `${data.attendance.monthly.percentage}% · ${data.attendance.monthly.lateDays} late · ${data.attendance.monthly.leaveDays} leave`,
        icon: CalendarCheck,
        accent: 'indigo',
        onClick: () => navigate('/attendance'),
      },
      {
        key: 'leave',
        label: 'Leave balance',
        value: `${totalLeaveAvailable} days`,
        detail: `${data.leave.upcoming.length} upcoming · ${data.leave.pending.length} pending`,
        icon: CalendarDays,
        accent: 'violet',
        onClick: () => navigate('/leave'),
      },
      {
        key: 'tasks',
        label: 'Active tasks',
        value: metrics.tasks.total - metrics.tasks.completed,
        detail: `${metrics.tasks.overdue} overdue · ${metrics.tasks.dueSoon} due soon`,
        icon: ListTodo,
        accent: 'amber',
        onClick: () => navigateTo(navigate, '#my-tasks'),
      },
      {
        key: 'hours',
        label: 'Hours this week',
        value: `${metrics.timesheets.weekHours}h`,
        detail: `${metrics.timesheets.pending} pending · ${metrics.timesheets.draft} draft`,
        icon: ClipboardList,
        accent: 'sky',
        onClick: () => navigate('/timesheets'),
      },
    )
  }

  const attendanceAction = checkedOut
    ? {
        label: 'View attendance',
        icon: Clock,
        onClick: () => navigate('/attendance'),
      }
    : checkedIn
      ? { label: 'Check out', icon: LogOut, onClick: handleCheckOut }
      : { label: 'Check in', icon: LogIn, onClick: handleCheckIn }

  const quickActions = isAdmin
    ? [
        {
          label: 'Add employee',
          icon: UserPlus,
          onClick: () => navigate('/employees?action=add'),
        },
        {
          label: 'Review approvals',
          icon: ClipboardCheck,
          onClick: () => navigateTo(navigate, '#action-center'),
        },
        {
          label: 'Post a job',
          icon: Briefcase,
          onClick: () => navigate('/recruitment?action=new'),
        },
        {
          label: 'Attendance',
          icon: CalendarDays,
          onClick: () => navigate('/attendance'),
        },
        {
          label: 'Departments',
          icon: Building2,
          onClick: () => navigateTo(navigate, '#departments'),
        },
      ]
    : isHr
      ? [
          {
            label: 'Add employee',
            icon: UserPlus,
            onClick: () => navigate('/employees?action=add'),
          },
          {
            label: 'Review leave',
            icon: CalendarDays,
            onClick: () => navigateTo(navigate, '#action-center'),
          },
          {
            label: 'Post a job',
            icon: Briefcase,
            onClick: () => navigate('/recruitment?action=new'),
          },
          {
            label: 'Onboarding',
            icon: UserCheck,
            onClick: () => navigateTo(navigate, '#onboarding'),
          },
          {
            label: 'Announcements',
            icon: Megaphone,
            onClick: () => navigateTo(navigate, '#announcements'),
          },
        ]
      : isManager
        ? [
            {
              label: 'Review approvals',
              icon: ClipboardCheck,
              onClick: () => navigateTo(navigate, '#action-center'),
            },
            {
              label: 'Team attendance',
              icon: UserCheck,
              onClick: () => navigate('/attendance'),
            },
            {
              label: 'Team leave',
              icon: CalendarDays,
              onClick: () => navigate('/leave'),
            },
            {
              label: 'Assign task',
              icon: UserPlus,
              onClick: openTaskModal,
            },
            {
              label: 'Team directory',
              icon: Users,
              onClick: () => navigate('/employees'),
            },
          ]
        : isFinance
          ? [
              {
                label: 'Attendance',
                icon: Clock,
                onClick: () => navigate('/attendance'),
              },
              {
                label: 'Timesheets',
                icon: ClipboardList,
                onClick: () => navigate('/timesheets'),
              },
              {
                label: 'Leave',
                icon: CalendarDays,
                onClick: () => navigate('/leave'),
              },
              {
                label: 'Reports',
                icon: TrendingUp,
                onClick: () => navigate('/reports'),
              },
              {
                label: 'Announcements',
                icon: Megaphone,
                onClick: () => navigateTo(navigate, '#announcements'),
              },
            ]
          : isSales
            ? [
                {
                  label: 'Open CRM',
                  icon: Handshake,
                  onClick: () => navigate('/crm'),
                },
                {
                  label: 'Projects',
                  icon: FolderKanban,
                  onClick: () => navigate('/projects'),
                },
                {
                  label: 'Reports',
                  icon: TrendingUp,
                  onClick: () => navigate('/reports'),
                },
                {
                  label: 'Attendance',
                  icon: Clock,
                  onClick: () => navigate('/attendance'),
                },
                {
                  label: 'Leave',
                  icon: CalendarDays,
                  onClick: () => navigate('/leave'),
                },
              ]
            : isClient
              ? [
                  {
                    label: 'Your projects',
                    icon: FolderKanban,
                    onClick: () => navigate('/projects'),
                  },
                ]
              : [
                  attendanceAction,
                  {
                    label: 'Apply leave',
                    icon: CalendarPlus,
                    onClick: () => navigate('/leave?action=new'),
                  },
                  {
                    label: 'Log time',
                    icon: Timer,
                    onClick: () => navigate('/timesheets?action=new'),
                  },
                  {
                    label: 'My tasks',
                    icon: ListChecks,
                    onClick: () => navigateTo(navigate, '#my-tasks'),
                  },
                  {
                    label: 'Announcements',
                    icon: Megaphone,
                    onClick: () => navigateTo(navigate, '#announcements'),
                  },
                ]

  const teamTasks = sortTasks(data.tasks.all)
  const myTasks = sortTasks(data.tasks.mine)
  const projectNames = [
    'Internal',
    ...new Set(data.projects.map((project) => project.name)),
  ]
  const hoursData = buildWeeklyHours(data.timesheets.mine)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardHeader
        user={user}
        roleKey={roleKey}
        roleLabel={data.roleLabel}
        scopeLabel={data.scope.label}
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
        onRefresh={refresh}
        refreshing={loading}
        subtitle={SUBTITLES[roleKey] ?? SUBTITLES.employee}
      />

      {notice ? (
        <InlineNotice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.message}
        </InlineNotice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(({ key, ...kpi }) => (
          <KpiCard key={key} {...kpi} />
        ))}
      </div>

      <QuickActions actions={quickActions} />

      {can.viewOrgAnalytics ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              title="Attendance trend"
              description={`Organization presence across the last ${rangeDays} days`}
              icon={TrendingUp}
              className="lg:col-span-2"
              bodyClassName="p-4"
            >
              <AttendanceTrendChart data={data.attendance.trend} height={300} />
            </SectionCard>

            <ActionCenter
              items={data.approvals}
              onAction={handleApproval}
              onOpen={(link) => navigateTo(navigate, link)}
              onViewAll={() => navigate('/leave')}
              limit={6}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TodayAttendanceTable
              rows={data.attendance.today}
              onViewAll={() => navigate('/attendance')}
              className="lg:col-span-2"
              limit={7}
            />
            <WhosOutToday
              items={data.whosOut}
              onViewAll={() => navigate('/attendance')}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              id="departments"
              title="Department distribution"
              description="Headcount by department"
              icon={Building2}
              bodyClassName="p-4"
            >
              <DepartmentPieChart
                data={data.departmentDistribution}
                height={250}
              />
            </SectionCard>

            <SectionCard
              title="Recruitment funnel"
              description="Candidates by hiring stage"
              icon={Briefcase}
              bodyClassName="p-4"
            >
              <RecruitmentFunnelChart
                data={data.recruitment.funnel}
                height={250}
              />
            </SectionCard>

            <OnboardingCard
              onboarding={data.onboarding}
              onToggle={toggleOnboardingItem}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {isAdmin ? (
              <ProjectListCard
                projects={activeProjects}
                onViewAll={() => navigate('/projects')}
                className="lg:col-span-2"
                limit={4}
              />
            ) : (
              <InterviewsCard
                interviews={data.recruitment.upcomingInterviews}
                onViewAll={() => navigate('/recruitment')}
                className="lg:col-span-2"
                limit={4}
              />
            )}
            <MyDay
              items={data.myDay}
              onNavigate={(link) => navigateTo(navigate, link)}
              dateLabel={myDayDateLabel}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ActivityTable
              items={data.activity}
              onOpen={(link) => navigateTo(navigate, link)}
              className="lg:col-span-2"
            />
            <div className="space-y-6">
              <AnnouncementsCard items={data.announcements} limit={2} />
              <HolidaysCard items={data.holidays} limit={2} />
            </div>
          </div>
        </>
      ) : null}

      {can.viewTeam ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              title="Team attendance trend"
              description={`Daily presence across the last ${rangeDays} days`}
              icon={TrendingUp}
              className="lg:col-span-2"
              bodyClassName="p-4"
            >
              <AttendanceTrendChart data={data.attendance.trend} height={300} />
            </SectionCard>

            <ActionCenter
              items={data.approvals}
              onAction={handleApproval}
              onOpen={(link) => navigateTo(navigate, link)}
              onViewAll={() => navigate('/leave')}
              limit={6}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TodayAttendanceTable
              rows={data.attendance.today}
              onViewAll={() => navigate('/attendance')}
              className="lg:col-span-2"
            />
            <WhosOutToday
              items={data.whosOut}
              onViewAll={() => navigate('/attendance')}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              title="Team workload"
              description="Active and overdue tasks by person"
              icon={ListTodo}
              bodyClassName="p-4"
            >
              <WorkloadBarChart data={data.tasks.workload} height={260} />
            </SectionCard>

            <TaskListCard
              id="team-tasks"
              tasks={teamTasks}
              showAssignee
              className="lg:col-span-2"
              title="Team tasks"
              description="Active work across your team"
              limit={5}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ProjectListCard
              projects={activeProjects}
              onViewAll={() => navigate('/projects')}
              className="lg:col-span-2"
              title="Team projects"
              description="Delivery health for projects your team contributes to"
              limit={4}
            />
            <OnboardingCard onboarding={data.onboarding} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ActivityTable
              items={data.activity}
              onOpen={(link) => navigateTo(navigate, link)}
              className="lg:col-span-2"
            />
            <MyDay
              items={data.myDay}
              onNavigate={(link) => navigateTo(navigate, link)}
              dateLabel={myDayDateLabel}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AnnouncementsCard
              items={data.announcements}
              className="lg:col-span-2"
              limit={2}
            />
            <HolidaysCard items={data.holidays} limit={2} />
          </div>
        </>
      ) : null}

      {can.viewPersonal ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <MyDay
              items={data.myDay}
              onNavigate={(link) => navigateTo(navigate, link)}
              dateLabel={myDayDateLabel}
            />
            <MyAttendanceCard
              record={todayRecord}
              monthly={data.attendance.monthly}
              liveHours={data.attendance.liveHours}
              history={data.attendance.history}
              onViewAll={() => navigate('/attendance')}
            />
            <LeaveBalancesCard
              balances={data.leave.balances}
              onViewAll={() => navigate('/leave?action=new')}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TaskListCard
              tasks={myTasks}
              canComplete
              onComplete={handleCompleteTask}
              className="lg:col-span-2"
              title="My tasks"
              description="Prioritized work assigned to you"
              limit={5}
            />
            <HolidaysCard items={data.holidays} limit={3} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              title="Logged hours"
              description="Your timesheet hours over the last 7 days"
              icon={ClipboardList}
              className="lg:col-span-2"
              bodyClassName="p-4"
            >
              <HoursBarChart data={hoursData} height={260} />
            </SectionCard>
            <WhosOutToday
              items={data.whosOut}
              onViewAll={() => navigate('/attendance')}
              title="Team availability"
              description="Who is on leave or remote today"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AnnouncementsCard
              items={data.announcements}
              className="lg:col-span-2"
              limit={3}
            />
            <ActivityTable
              items={data.activity}
              onOpen={(link) => navigateTo(navigate, link)}
            />
          </div>
        </>
      ) : null}

      {can.assignTasks ? (
        <Modal
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          title="Assign a task"
          description="Create a task for a member of your team."
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label
                htmlFor="task-title"
                className="text-xs font-semibold text-slate-600"
              >
                Task title
              </label>
              <input
                id="task-title"
                type="text"
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((form) => ({
                    ...form,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. Review the sprint demo"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="task-assignee"
                  className="text-xs font-semibold text-slate-600"
                >
                  Assignee
                </label>
                <select
                  id="task-assignee"
                  value={taskForm.assigneeId}
                  onChange={(event) =>
                    setTaskForm((form) => ({
                      ...form,
                      assigneeId: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {data.employees.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-project"
                  className="text-xs font-semibold text-slate-600"
                >
                  Project
                </label>
                <select
                  id="task-project"
                  value={taskForm.project}
                  onChange={(event) =>
                    setTaskForm((form) => ({
                      ...form,
                      project: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {projectNames.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-priority"
                  className="text-xs font-semibold text-slate-600"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm((form) => ({
                      ...form,
                      priority: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-due"
                  className="text-xs font-semibold text-slate-600"
                >
                  Due date
                </label>
                <input
                  id="task-due"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm((form) => ({
                      ...form,
                      dueDate: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="task-description"
                className="text-xs font-semibold text-slate-600"
              >
                Description
              </label>
              <textarea
                id="task-description"
                rows={3}
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((form) => ({
                    ...form,
                    description: event.target.value,
                  }))
                }
                placeholder="Add context or acceptance criteria"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {taskError ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {taskError}
              </p>
      ) : null}

      {can.viewFinance ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              id="finance-overview"
              title="Attendance trend"
              description={`Organization presence across the last ${rangeDays} days`}
              icon={TrendingUp}
              className="lg:col-span-2"
              bodyClassName="p-4"
            >
              <AttendanceTrendChart data={data.attendance.trend} height={300} />
            </SectionCard>
            <SectionCard
              title="Department distribution"
              description="Headcount by department"
              icon={Building2}
              bodyClassName="p-4"
            >
              <DepartmentPieChart
                data={data.departmentDistribution}
                height={250}
              />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TodayAttendanceTable
              rows={data.attendance.today}
              onViewAll={() => navigate('/attendance')}
              className="lg:col-span-2"
              limit={7}
            />
            <WhosOutToday
              items={data.whosOut}
              onViewAll={() => navigate('/attendance')}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ActivityTable
              items={data.activity}
              onOpen={(link) => navigateTo(navigate, link)}
              className="lg:col-span-2"
            />
            <div className="space-y-6">
              <AnnouncementsCard items={data.announcements} limit={2} />
              <HolidaysCard items={data.holidays} limit={2} />
            </div>
          </div>
        </>
      ) : null}

      {can.viewSales ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ProjectListCard
              projects={activeProjects}
              onViewAll={() => navigate('/projects')}
              className="lg:col-span-2"
              limit={5}
            />
            <HolidaysCard items={data.holidays} limit={3} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ActivityTable
              items={data.activity}
              onOpen={(link) => navigateTo(navigate, link)}
              className="lg:col-span-2"
            />
            <AnnouncementsCard items={data.announcements} limit={3} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              title="Department distribution"
              description="Headcount by department"
              icon={Building2}
              className="lg:col-span-2"
              bodyClassName="p-4"
            >
              <DepartmentPieChart
                data={data.departmentDistribution}
                height={250}
              />
            </SectionCard>
            <WhosOutToday
              items={data.whosOut}
              onViewAll={() => navigate('/attendance')}
            />
          </div>
        </>
      ) : null}

      {can.viewClient ? (
        <ProjectListCard
          projects={activeProjects}
          onViewAll={() => navigate('/projects')}
          title="Your projects"
          description="Delivery progress across your portfolio"
          limit={8}
        />
      ) : null}


            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Assign task
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
