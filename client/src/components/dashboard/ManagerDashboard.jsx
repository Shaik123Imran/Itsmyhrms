import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardCheck,
  Clock,
  ListTodo,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import Modal from '../Modal'
import { formatDate, isoOffset } from '../../utils/date'
import { navigateTo } from '../../utils/navigation'
import {
  approveLeave,
  approveTimesheet,
  rejectLeave,
  rejectTimesheet,
} from '../../services/dashboardService'
import { createTask } from '../../services/workspaceStore'
import { ActionCenter } from './ActionCenter'
import { ActivityTable } from './ActivityTable'
import { AnnouncementsCard } from './AnnouncementsCard'
import { AttendanceTrendChart, WorkloadBarChart } from './charts'
import { DashboardHeader } from './DashboardHeader'
import { HolidaysCard } from './HolidaysCard'
import { MyDay } from './MyDay'
import { OnboardingCard } from './OnboardingCard'
import { ProjectListCard } from './ProjectListCard'
import { TaskListCard } from './TaskListCard'
import { TodayAttendanceTable } from './TodayAttendanceTable'
import { WhosOutToday } from './WhosOutToday'
import {
  InlineNotice,
  KpiCard,
  QuickActions,
  SectionCard,
} from './ui'

const EMPTY_FORM = {
  title: '',
  project: 'Internal',
  assigneeId: '',
  priority: 'Medium',
  dueDate: isoOffset(3),
  description: '',
}

export function ManagerDashboard({
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
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskForm, setTaskForm] = useState(EMPTY_FORM)
  const [taskError, setTaskError] = useState('')
  const [notice, setNotice] = useState(null)

  const teamMembers = data.employees
  const activeProjects = data.projects.filter(
    (project) => project.status !== 'Completed',
  )
  const teamTasks = [...data.tasks.all].sort((left, right) => {
    if (left.status === 'Completed' && right.status !== 'Completed') return 1
    if (left.status !== 'Completed' && right.status === 'Completed') return -1
    return String(left.dueDate).localeCompare(String(right.dueDate))
  })

  const projectNames = [
    'Internal',
    ...new Set(data.projects.map((project) => project.name)),
  ]

  const openTaskModal = () => {
    setTaskForm({
      ...EMPTY_FORM,
      assigneeId: teamMembers[0]?.id ?? '',
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

    const assignee = teamMembers.find(
      (member) => member.id === taskForm.assigneeId,
    )

    createTask({ ...taskForm, title: taskForm.title.trim() }, user)
    setTaskModalOpen(false)
    setNotice({
      tone: 'success',
      message: `Task assigned to ${assignee?.name ?? 'your team member'}.`,
    })
  }

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
        subtitle="Your team's attendance, workload, approvals, and delivery health."
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
          label="Team members"
          value={metrics.totalEmployees}
          detail={`${metrics.activeEmployees} active · ${metrics.onLeaveEmployees} on leave`}
          icon={Users}
          accent="indigo"
          onClick={() => navigate('/employees')}
        />
        <KpiCard
          label="Team attendance"
          value={`${attendance.working}/${attendance.total}`}
          detail={`${attendance.present} present · ${attendance.remote} remote · ${attendance.notMarked} not marked`}
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
          label="Active tasks"
          value={metrics.tasks.total - metrics.tasks.completed}
          detail={`${metrics.tasks.overdue} overdue · ${metrics.tasks.dueSoon} due soon`}
          icon={ListTodo}
          accent="rose"
          onClick={() => navigateTo(navigate, '#team-tasks')}
        />
        <KpiCard
          label="Hours this week"
          value={`${metrics.timesheets.weekHours}h`}
          detail={`${metrics.timesheets.pending} pending · ${metrics.timesheets.completion}% approved`}
          icon={Clock}
          accent="sky"
          onClick={() => navigate('/timesheets')}
        />
      </div>

      <QuickActions actions={quickActions} />

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
          dateLabel={formatDate(data.today, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
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
                setTaskForm((form) => ({ ...form, title: event.target.value }))
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
                {teamMembers.map((member) => (
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
    </div>
  )
}
