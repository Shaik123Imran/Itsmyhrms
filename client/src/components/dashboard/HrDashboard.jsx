import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { formatDate } from '../../utils/date'
import { navigateTo } from '../../utils/navigation'
import {
  approveLeave,
  approveTimesheet,
  rejectLeave,
  rejectTimesheet,
} from '../../services/dashboardService'
import { toggleOnboardingItem } from '../../services/workspaceStore'
import { ActionCenter } from './ActionCenter'
import { ActivityTable } from './ActivityTable'
import { AnnouncementsCard } from './AnnouncementsCard'
import { AttendanceTrendChart, DepartmentPieChart, RecruitmentFunnelChart } from './charts'
import { DashboardHeader } from './DashboardHeader'
import { HolidaysCard } from './HolidaysCard'
import { InterviewsCard } from './InterviewsCard'
import { MyDay } from './MyDay'
import { OnboardingCard } from './OnboardingCard'
import { TodayAttendanceTable } from './TodayAttendanceTable'
import { WhosOutToday } from './WhosOutToday'
import { KpiCard, QuickActions, SectionCard } from './ui'

export function HrDashboard({
  data,
  user,
  rangeDays,
  onRangeChange,
  onRefresh,
  refreshing,
}) {
  const navigate = useNavigate()
  const metrics = data.metrics
  const attendance = metrics.attendance

  const handleApproval = async (item, action) => {
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

  const quickActions = [
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
        subtitle="People operations, hiring, and onboarding in one place."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total employees"
          value={metrics.totalEmployees}
          detail={`${metrics.activeEmployees} active · ${metrics.onLeaveEmployees} on leave`}
          icon={Users}
          accent="indigo"
          onClick={() => navigate('/employees')}
        />
        <KpiCard
          label="Present today"
          value={`${attendance.working}/${attendance.total}`}
          detail={`${attendance.present} present · ${attendance.remote} remote · ${attendance.late} late`}
          icon={UserCheck}
          accent="emerald"
          trend={{
            label: `${attendance.presentRate}%`,
            positive: attendance.presentRate >= 75,
          }}
          onClick={() => navigate('/attendance')}
        />
        <KpiCard
          label="Pending approvals"
          value={metrics.approvals.total}
          detail={`${metrics.approvals.leave} leave · ${metrics.approvals.timesheet} timesheets`}
          icon={ClipboardCheck}
          accent="amber"
          onClick={() => navigateTo(navigate, '#action-center')}
        />
        <KpiCard
          label="Onboarding"
          value={metrics.onboarding.inProgress}
          detail={`${metrics.onboarding.completion}% complete · ${metrics.onboarding.pendingItems} items pending`}
          icon={UserCheck}
          accent="violet"
          onClick={() => navigateTo(navigate, '#onboarding')}
        />
        <KpiCard
          label="Open positions"
          value={metrics.recruitment.openJobs}
          detail={`${metrics.recruitment.candidates} candidates · ${metrics.recruitment.interviews} interviews`}
          icon={Briefcase}
          accent="sky"
          onClick={() => navigate('/recruitment')}
        />
      </div>

      <QuickActions actions={quickActions} />

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
        <OnboardingCard
          onboarding={data.onboarding}
          onToggle={toggleOnboardingItem}
        />

        <SectionCard
          title="Recruitment funnel"
          description="Candidates by hiring stage"
          icon={Briefcase}
          bodyClassName="p-4"
        >
          <RecruitmentFunnelChart data={data.recruitment.funnel} height={250} />
        </SectionCard>

        <SectionCard
          id="departments"
          title="Department distribution"
          description="Headcount by department"
          icon={Building2}
          bodyClassName="p-4"
        >
          <DepartmentPieChart data={data.departmentDistribution} height={250} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <InterviewsCard
          interviews={data.recruitment.upcomingInterviews}
          onViewAll={() => navigate('/recruitment')}
          className="lg:col-span-2"
          limit={4}
        />
        <MyDay
          items={data.myDay}
          onNavigate={(link) => navigateTo(navigate, link)}
          dateLabel={formatDate(data.today, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
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
    </div>
  )
}
