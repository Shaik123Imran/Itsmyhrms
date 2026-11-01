import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Clock,
  ListChecks,
  ListTodo,
  LogIn,
  LogOut,
  Megaphone,
  Timer,
} from 'lucide-react'
import { formatClockTime, formatDate, isoOffset } from '../../utils/date'
import { navigateTo } from '../../utils/navigation'
import { checkIn, checkOut, completeTask } from '../../services/workspaceStore'
import { ActivityTable } from './ActivityTable'
import { AnnouncementsCard } from './AnnouncementsCard'
import { HoursBarChart } from './charts'
import { DashboardHeader } from './DashboardHeader'
import { HolidaysCard } from './HolidaysCard'
import { LeaveBalancesCard } from './LeaveBalancesCard'
import { MyAttendanceCard } from './MyAttendanceCard'
import { MyDay } from './MyDay'
import { TaskListCard } from './TaskListCard'
import { WhosOutToday } from './WhosOutToday'
import {
  InlineNotice,
  KpiCard,
  QuickActions,
  SectionCard,
} from './ui'

export function EmployeeDashboard({
  data,
  user,
  rangeDays,
  onRangeChange,
  onRefresh,
  refreshing,
}) {
  const navigate = useNavigate()
  const metrics = data.metrics
  const todayRecord = data.attendance.todayRecord
  const checkedIn = Boolean(todayRecord?.checkIn)
  const checkedOut = Boolean(todayRecord?.checkOut)
  const [notice, setNotice] = useState(null)

  const totalLeaveAvailable = data.leave.balances.reduce(
    (sum, balance) => sum + balance.available,
    0,
  )

  const myTasks = [...data.tasks.mine].sort((left, right) => {
    if (left.status === 'Completed' && right.status !== 'Completed') return 1
    if (left.status !== 'Completed' && right.status === 'Completed') return -1
    return String(left.dueDate).localeCompare(String(right.dueDate))
  })

  const hoursByDate = new Map()
  data.timesheets.mine.forEach((entry) => {
    if (entry.dateISO >= isoOffset(-6)) {
      hoursByDate.set(
        entry.dateISO,
        (hoursByDate.get(entry.dateISO) ?? 0) + entry.hours,
      )
    }
  })

  const hoursData = Array.from({ length: 7 }, (_, index) => {
    const date = isoOffset(-(6 - index))
    return {
      label: formatDate(date, { weekday: 'short' }),
      hours: Math.round((hoursByDate.get(date) ?? 0) * 10) / 10,
    }
  })

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
          error instanceof Error ? error.message : 'Unable to check in right now.',
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

  const attendanceAction = checkedOut
    ? {
        label: 'View attendance',
        icon: Clock,
        onClick: () => navigate('/attendance'),
      }
    : checkedIn
      ? { label: 'Check out', icon: LogOut, onClick: handleCheckOut }
      : { label: 'Check in', icon: LogIn, onClick: handleCheckIn }

  const quickActions = [
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

  const status = todayRecord?.status ?? 'Not marked'
  const statusDetail = todayRecord?.checkIn
    ? `Checked in at ${formatClockTime(todayRecord.checkIn)}${
        todayRecord.checkOut
          ? ` · out at ${formatClockTime(todayRecord.checkOut)}`
          : ' · in progress'
      }`
    : 'No check-in yet today'

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardHeader
        user={user}
        roleKey={data.roleKey}
        roleLabel={data.roleLabel}
        scopeLabel={data.scope.label}
        rangeDays={rangeDays}
        onRangeChange={onRangeChange}
        onRefresh={onRefresh}
        refreshing={refreshing}
        subtitle="Your attendance, tasks, leave, and timesheets at a glance."
      />

      {notice ? (
        <InlineNotice
          tone={notice.tone}
          onDismiss={() => setNotice(null)}
        >
          {notice.message}
        </InlineNotice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Today's status"
          value={status}
          detail={statusDetail}
          icon={Clock}
          accent="emerald"
          onClick={() => navigate('/attendance')}
        />
        <KpiCard
          label="This month"
          value={`${data.attendance.monthly.presentDays}/${data.attendance.monthly.workingDays}`}
          detail={`${data.attendance.monthly.percentage}% · ${data.attendance.monthly.lateDays} late · ${data.attendance.monthly.leaveDays} leave`}
          icon={CalendarCheck}
          accent="indigo"
          onClick={() => navigate('/attendance')}
        />
        <KpiCard
          label="Leave balance"
          value={`${totalLeaveAvailable} days`}
          detail={`${data.leave.upcoming.length} upcoming · ${data.leave.pending.length} pending`}
          icon={CalendarDays}
          accent="violet"
          onClick={() => navigate('/leave')}
        />
        <KpiCard
          label="Active tasks"
          value={metrics.tasks.total - metrics.tasks.completed}
          detail={`${metrics.tasks.overdue} overdue · ${metrics.tasks.dueSoon} due soon`}
          icon={ListTodo}
          accent="amber"
          onClick={() => navigateTo(navigate, '#my-tasks')}
        />
        <KpiCard
          label="Hours this week"
          value={`${metrics.timesheets.weekHours}h`}
          detail={`${metrics.timesheets.pending} pending · ${metrics.timesheets.draft} draft`}
          icon={ClipboardList}
          accent="sky"
          onClick={() => navigate('/timesheets')}
        />
      </div>

      <QuickActions actions={quickActions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MyDay
          items={data.myDay}
          onNavigate={(link) => navigateTo(navigate, link)}
          dateLabel={formatDate(data.today, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
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
        <ActivityTable items={data.activity} onOpen={(link) => navigateTo(navigate, link)} />
      </div>
    </div>
  )
}
