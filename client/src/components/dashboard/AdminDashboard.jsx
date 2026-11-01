import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
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
import { MyDay } from './MyDay'
import { OnboardingCard } from './OnboardingCard'
import { ProjectListCard } from './ProjectListCard'
import { TodayAttendanceTable } from './TodayAttendanceTable'
import { WhosOutToday } from './WhosOutToday'
import { KpiCard, QuickActions, SectionCard } from './ui'

export function AdminDashboard({
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

  const activeProjects = data.projects.filter(
    (project) => project.status !== 'Completed',
  )

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
        subtitle="A complete view of people, attendance, hiring, and delivery health."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total employees"
          value={metrics.totalEmployees}
          detail={`${metrics.activeEmployees} active · ${metrics.newJoiners} new joiners`}
          icon={Users}
          accent="indigo"
          onClick={() => navigate('/employees')}
        />
        <KpiCard
          label="Attendance today"
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
          label="Open positions"
          value={metrics.recruitment.openJobs}
          detail={`${metrics.recruitment.candidates} candidates · ${metrics.recruitment.interviews} interviews`}
          icon={Briefcase}
          accent="sky"
          onClick={() => navigate('/recruitment')}
        />
        <KpiCard
          label="Projects at risk"
          value={metrics.projects.atRisk}
          detail={`${metrics.projects.active} active · ${metrics.projects.averageProgress}% avg progress`}
          icon={FolderKanban}
          accent="rose"
          onClick={() => navigate('/projects')}
        />
      </div>

      <QuickActions actions={quickActions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Attendance trend"
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
          <DepartmentPieChart data={data.departmentDistribution} height={250} />
        </SectionCard>

        <SectionCard
          title="Recruitment funnel"
          description="Candidates by hiring stage"
          icon={Briefcase}
          bodyClassName="p-4"
        >
          <RecruitmentFunnelChart data={data.recruitment.funnel} height={250} />
        </SectionCard>

        <OnboardingCard
          onboarding={data.onboarding}
          onToggle={toggleOnboardingItem}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProjectListCard
          projects={activeProjects}
          onViewAll={() => navigate('/projects')}
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
