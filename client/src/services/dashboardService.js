import {
  canApproveForRole,
  getRoleKey,
  getRoleLabel,
  isOrgWideRole,
} from '../config/roles'
import {
  addDays,
  formatClockTime,
  formatDate,
  fromISODate,
  hoursBetween,
  isoOffset,
  isWeekend,
  listDates,
  monthLabel,
  nowTimeString,
  relativeLabel,
  relativeTime,
  startOfMonth,
  toISODate,
  workingDaysBetween,
} from '../utils/date'
import {
  STORAGE_KEYS,
  getCollection,
  getCurrentEmployee,
  getEmployees,
  getInitials,
  getTeamMembers,
  markNotificationRead,
  subscribeToWorkspace,
  updateCollection,
  updateLeaveStatus,
  updateTimesheetStatus,
  ensureWorkspaceSeed,
} from './workspaceStore'

const PIE_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
]

const WORKING_STATUSES = ['Present', 'Late', 'Remote']
const FUNNEL_STAGES = ['Applied', 'Screening', 'Interview', 'Offer']

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function setFrom(values) {
  return new Set(values.filter(Boolean))
}

function inSet(values, set) {
  return values.filter((value) => set.has(value))
}

function unique(values) {
  return [...new Set(values)]
}

function sortByDateDesc(left, right) {
  return String(right.date ?? right.dateISO ?? '').localeCompare(
    String(left.date ?? left.dateISO ?? ''),
  )
}

function sortByDateAsc(left, right) {
  return String(left.date ?? left.startDate ?? left.dueDate ?? '').localeCompare(
    String(right.date ?? right.startDate ?? right.dueDate ?? ''),
  )
}

function resolveScope(user, employees) {
  const roleKey = getRoleKey(user?.role)
  const currentEmployee = getCurrentEmployee(user, employees)

  let visibleEmployees = []
  let scopeLabel = 'My workspace'

  if (isOrgWideRole(roleKey)) {
    visibleEmployees = employees
    scopeLabel = roleKey === 'client' ? 'Client portfolio' : 'Organization'
  } else if (roleKey === 'manager') {
    visibleEmployees = currentEmployee
      ? getTeamMembers(currentEmployee.id, employees)
      : []
    scopeLabel = 'My team'
  } else {
    visibleEmployees = currentEmployee ? [currentEmployee] : []
    scopeLabel = 'Me'
  }

  return {
    roleKey,
    roleLabel: getRoleLabel(user?.role),
    currentEmployee,
    visibleEmployees,
    scopeIds: visibleEmployees.map((employee) => employee.id),
    scopeLabel,
    isOrgWide: isOrgWideRole(roleKey),
  }
}

function getProjectScopeInitials(scope) {
  if (isOrgWideRole(scope.roleKey)) {
    return null
  }

  const initials = scope.visibleEmployees.map((employee) =>
    getInitials(employee.name),
  )

  if (scope.roleKey === 'manager' && scope.currentEmployee) {
    initials.push(getInitials(scope.currentEmployee.name))
  }

  return setFrom(initials)
}

function filterProjects(projects, scope) {
  const allowed = getProjectScopeInitials(scope)
  if (!allowed) {
    return projects
  }

  return projects.filter((project) =>
    (project.team ?? []).some((member) => allowed.has(member)),
  )
}

function normalizeTask(task, today) {
  const completed = task.status === 'Completed'
  const overdue = !completed && task.dueDate < today
  const dueSoon =
    !completed && !overdue && task.dueDate <= isoOffset(3, new Date(`${today}T00:00:00`))

  return {
    ...task,
    isOverdue: overdue,
    isDueSoon: dueSoon,
    displayStatus: completed ? 'Completed' : overdue ? 'Overdue' : task.status,
  }
}

function buildAttendanceSummary(rows) {
  const count = (status) =>
    rows.filter((row) => row.status === status).length

  const present = count('Present')
  const late = count('Late')
  const remote = count('Remote')
  const onLeave = count('On Leave')
  const absent = count('Absent')
  const notMarked = count('Not marked')
  const working = present + late + remote
  const total = rows.length

  return {
    present,
    late,
    remote,
    onLeave,
    absent,
    notMarked,
    working,
    total,
    presentRate: total ? Math.round((working / total) * 100) : 0,
  }
}

function buildTrend(attendance, rangeDays) {
  const today = toISODate()
  const start = isoOffset(-(rangeDays - 1))
  const dates = listDates(start, today).filter(
    (date) => !isWeekend(date) || date === today,
  )

  const byDate = new Map(
    dates.map((date) => [
      date,
      {
        date,
        label: formatDate(date, { month: 'short', day: 'numeric' }),
        present: 0,
        late: 0,
        remote: 0,
        onLeave: 0,
        absent: 0,
      },
    ]),
  )

  attendance.forEach((record) => {
    const bucket = byDate.get(record.date)
    if (!bucket) {
      return
    }

    if (record.status === 'Present') bucket.present += 1
    if (record.status === 'Late') bucket.late += 1
    if (record.status === 'Remote') bucket.remote += 1
    if (record.status === 'On Leave') bucket.onLeave += 1
    if (record.status === 'Absent') bucket.absent += 1
  })

  return dates.map((date) => byDate.get(date))
}

function buildMonthlyAttendance(attendance, today) {
  const monthStart = toISODate(startOfMonth(today))
  const workingDays = workingDaysBetween(monthStart, today)
  const monthRecords = attendance.filter(
    (record) => record.date >= monthStart && record.date <= today,
  )

  const attendedDates = unique(
    monthRecords
      .filter((record) => WORKING_STATUSES.includes(record.status))
      .map((record) => record.date),
  )

  const presentDays = attendedDates.length
  const lateDays = monthRecords.filter(
    (record) => record.status === 'Late',
  ).length
  const absentDays = monthRecords.filter(
    (record) => record.status === 'Absent',
  ).length
  const leaveDays = monthRecords.filter(
    (record) => record.status === 'On Leave',
  ).length

  return {
    monthStart,
    monthLabel: monthLabel(today),
    workingDays,
    presentDays,
    lateDays,
    absentDays,
    leaveDays,
    percentage: workingDays
      ? Math.min(100, Math.round((presentDays / workingDays) * 100))
      : 0,
    history: [...monthRecords].sort(sortByDateDesc).slice(0, 12),
  }
}

function buildWorkload(tasks, employees) {
  return employees.map((employee) => {
    const employeeTasks = tasks.filter(
      (task) => task.assigneeId === employee.id,
    )
    const active = employeeTasks.filter(
      (task) => task.status !== 'Completed',
    )

    return {
      id: employee.id,
      name: employee.name,
      initials: getInitials(employee.name),
      total: active.length,
      high: active.filter((task) => task.priority === 'High').length,
      overdue: active.filter((task) => task.isOverdue).length,
      completed: employeeTasks.length - active.length,
    }
  })
}

function buildActionItems({
  scope,
  leave,
  timesheets,
  tasks,
  onboarding,
  candidates,
  employees,
  today,
}) {
  const items = []
  const canApprove = canApproveForRole(scope.roleKey)

  leave
    .filter((record) => record.status === 'Pending')
    .forEach((record) => {
      items.push({
        id: `leave-${record.id}`,
        entityId: record.id,
        kind: 'leave',
        title: `${record.employeeName} · ${record.type}`,
        description: `${formatDate(record.startDate)} – ${formatDate(
          record.endDate,
        )} · ${record.days} ${record.days === 1 ? 'day' : 'days'}`,
        priority: record.startDate <= today ? 'high' : 'medium',
        due: record.startDate,
        link: `/leave?request=${record.id}`,
        canApprove: canApprove && scope.scopeIds.includes(record.employeeId),
        actionLabel: 'Approve',
      })
    })

  timesheets
    .filter((entry) => entry.status === 'Pending')
    .forEach((entry) => {
      items.push({
        id: `timesheet-${entry.id}`,
        entityId: entry.id,
        kind: 'timesheet',
        title: `${entry.employeeName} · ${entry.task}`,
        description: `${entry.project} · ${entry.hours}h · ${formatDate(
          entry.dateISO,
        )}`,
        priority: 'medium',
        due: entry.dateISO,
        link: `/timesheets?entry=${entry.id}`,
        canApprove: canApprove && scope.scopeIds.includes(entry.employeeId),
        actionLabel: 'Approve',
      })
    })

  tasks
    .filter((task) => task.isOverdue)
    .forEach((task) => {
      items.push({
        id: `task-${task.id}`,
        entityId: task.id,
        kind: 'task',
        title: `Overdue task · ${task.title}`,
        description: `${task.assigneeName} · ${task.project}`,
        priority: 'high',
        due: task.dueDate,
        link:
          scope.roleKey === 'employee'
            ? '/?focus=my-tasks'
            : '/?focus=team-tasks',
        canApprove: false,
        actionLabel: 'View',
      })
    })

  onboarding
    .filter((record) => record.status !== 'Completed')
    .forEach((record) => {
      const pending = record.checklist.filter((item) => !item.done).length
      if (pending === 0) {
        return
      }

      items.push({
        id: `onboarding-${record.id}`,
        entityId: record.id,
        kind: 'onboarding',
        title: `Onboarding · ${record.employeeName}`,
        description: `${pending} checklist item${pending === 1 ? '' : 's'} remaining`,
        priority: pending > 2 ? 'high' : 'medium',
        due: record.startDate,
        link: '/?focus=onboarding',
        canApprove: false,
        actionLabel: 'Review',
      })
    })

  if (scope.roleKey === 'admin' || scope.roleKey === 'hr') {
    candidates
      .filter((candidate) => candidate.stage === 'Offer')
      .forEach((candidate) => {
        items.push({
          id: `offer-${candidate.id}`,
          entityId: candidate.id,
          kind: 'offer',
          title: `Offer awaiting decision · ${candidate.name}`,
          description: `${candidate.role} · ${candidate.source}`,
          priority: 'medium',
          due: candidate.appliedDate,
          link: '/recruitment?stage=Offer',
          canApprove: false,
          actionLabel: 'View',
        })
      })

    employees.forEach((employee) => {
      if (employee.status !== 'On Leave') {
        return
      }

      const approved = leave.some(
        (record) =>
          record.employeeId === employee.id &&
          record.status === 'Approved' &&
          record.startDate <= today &&
          record.endDate >= today,
      )

      if (!approved) {
        items.push({
          id: `record-${employee.id}`,
          entityId: employee.id,
          kind: 'record',
          title: `Record needs attention · ${employee.name}`,
          description: 'Marked on leave without an approved leave record',
          priority: 'high',
          due: today,
          link: '/employees',
          canApprove: false,
          actionLabel: 'Review',
        })
      }
    })
  }

  const priorityWeight = { high: 0, medium: 1, low: 2 }

  return items.sort((left, right) => {
    const priority =
      (priorityWeight[left.priority] ?? 3) - (priorityWeight[right.priority] ?? 3)
    if (priority !== 0) {
      return priority
    }
    return String(left.due).localeCompare(String(right.due))
  })
}

function buildWhosOut(scope, attendance, leave, employees, today) {
  let people = scope.visibleEmployees

  if (scope.roleKey === 'employee' && scope.currentEmployee?.managerId) {
    people = getTeamMembers(scope.currentEmployee.managerId, employees).filter(
      (employee) => employee.id !== scope.currentEmployee.id,
    )
  }

  const peopleById = new Map(people.map((employee) => [employee.id, employee]))
  const todayRecords = attendance.filter(
    (record) => record.date === today && peopleById.has(record.employeeId),
  )

  const entries = todayRecords
    .filter((record) => record.status === 'On Leave' || record.status === 'Remote')
    .map((record) => {
      const employee = peopleById.get(record.employeeId)
      const leaveRecord = leave.find(
        (item) =>
          item.employeeId === record.employeeId &&
          item.status === 'Approved' &&
          item.startDate <= today &&
          item.endDate >= today,
      )

      const isLeave = record.status === 'On Leave'
      const endDate = leaveRecord?.endDate ?? today
      const backOn = formatDate(toISODate(addDays(fromISODate(endDate), 1)))

      return {
        id: record.id,
        employeeId: record.employeeId,
        name: employee?.name ?? record.employeeName,
        department: employee?.department ?? record.department,
        initials: getInitials(employee?.name ?? record.employeeName),
        status: isLeave ? 'On leave' : 'Remote',
        detail: isLeave
          ? `${leaveRecord?.type ?? 'Leave'} · ${formatDate(
              leaveRecord?.startDate ?? today,
            )} – ${formatDate(endDate)}`
          : 'Working remotely today',
        availability: isLeave ? `Back on ${backOn}` : 'Available online',
        tone: isLeave ? 'amber' : 'sky',
      }
    })

  return entries.sort((left, right) => {
    if (left.status === right.status) {
      return left.name.localeCompare(right.name)
    }
    return left.status === 'On leave' ? -1 : 1
  })
}

function buildMyDay({
  scope,
  today,
  todayRows,
  attendanceSummary,
  tasks,
  leave,
  timesheets,
  approvals,
  announcements,
  holidays,
  upcomingInterviews,
  newJoiners,
}) {
  const items = []
  const current = scope.currentEmployee

  if (scope.roleKey === 'employee' && current) {
    const record = todayRows.find((row) => row.id === current.id)

    if (record?.checkOut) {
      items.push({
        id: 'attendance',
        type: 'attendance',
        title: `Checked out at ${formatClockTime(record.checkOut)}`,
        description: `Checked in at ${formatClockTime(record.checkIn)} · ${record.hours}h logged`,
        time: 'Today',
        tone: 'success',
        link: '/attendance',
      })
    } else if (record?.checkIn) {
      items.push({
        id: 'attendance',
        type: 'attendance',
        title: `Checked in at ${formatClockTime(record.checkIn)}`,
        description: 'Your attendance is being tracked for today.',
        time: 'Today',
        tone: 'success',
        link: '/attendance',
      })
    } else {
      items.push({
        id: 'attendance',
        type: 'attendance',
        title: 'Check in for today',
        description: 'Start your workday and mark your attendance.',
        time: 'Today',
        tone: 'default',
        link: '/attendance',
      })
    }

    tasks
      .filter((task) => task.isOverdue || task.isDueSoon)
      .slice(0, 4)
      .forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          description: `${task.project} · ${task.displayStatus}`,
          time: relativeLabel(task.dueDate),
          tone: task.isOverdue ? 'danger' : 'default',
          link: '#my-tasks',
        })
      })

    leave
      .filter(
        (record) =>
          record.status === 'Pending' ||
          (record.status === 'Approved' && record.startDate >= today),
      )
      .slice(0, 2)
      .forEach((record) => {
        items.push({
          id: `leave-${record.id}`,
          type: 'leave',
          title: `${record.type} ${record.status.toLowerCase()}`,
          description: `${formatDate(record.startDate)} – ${formatDate(
            record.endDate,
          )}`,
          time: relativeLabel(record.startDate),
          tone: record.status === 'Pending' ? 'amber' : 'success',
          link: '/leave',
        })
      })

    const pendingTimesheet = timesheets.find(
      (entry) => entry.status === 'Pending' || entry.status === 'Draft',
    )
    if (pendingTimesheet) {
      items.push({
        id: `timesheet-${pendingTimesheet.id}`,
        type: 'timesheet',
        title: `Timesheet ${pendingTimesheet.status.toLowerCase()}`,
        description: `${pendingTimesheet.task} · ${pendingTimesheet.hours}h`,
        time: formatDate(pendingTimesheet.dateISO),
        tone: pendingTimesheet.status === 'Draft' ? 'amber' : 'default',
        link: '/timesheets',
      })
    }
  } else if (scope.roleKey === 'manager') {
    items.push({
      id: 'team-availability',
      type: 'team',
      title: `${attendanceSummary.working} of ${attendanceSummary.total} team members available`,
      description: `${attendanceSummary.onLeave} on leave · ${attendanceSummary.remote} remote · ${attendanceSummary.notMarked} not marked`,
      time: 'Today',
      tone: 'default',
      link: '/attendance',
    })

    leave
      .filter((record) => record.status === 'Pending')
      .slice(0, 3)
      .forEach((record) => {
        items.push({
          id: `leave-${record.id}`,
          type: 'leave',
          title: `${record.employeeName} requested ${record.type}`,
          description: `${formatDate(record.startDate)} – ${formatDate(
            record.endDate,
          )}`,
          time: relativeLabel(record.startDate),
          tone: 'amber',
          link: '#action-center',
        })
      })

    tasks
      .filter((task) => task.isOverdue || task.isDueSoon)
      .slice(0, 3)
      .forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          description: `${task.assigneeName} · ${task.displayStatus}`,
          time: relativeLabel(task.dueDate),
          tone: task.isOverdue ? 'danger' : 'default',
          link: '#team-tasks',
        })
      })
  } else {
    items.push({
      id: 'org-availability',
      type: 'team',
      title: `${attendanceSummary.working} of ${attendanceSummary.total} employees available`,
      description: `${attendanceSummary.onLeave} on leave · ${attendanceSummary.remote} remote · ${attendanceSummary.notMarked} not marked`,
      time: 'Today',
      tone: 'default',
      link: '/attendance',
    })

    if (approvals.length > 0) {
      items.push({
        id: 'approvals',
        type: 'approval',
        title: `${approvals.length} approval${approvals.length === 1 ? '' : 's'} pending`,
        description: 'Leave, timesheets, onboarding, and offers need review.',
        time: 'Today',
        tone: 'amber',
        link: '#action-center',
      })
    }

    upcomingInterviews.slice(0, 2).forEach((interview) => {
      items.push({
        id: `interview-${interview.id}`,
        type: 'interview',
        title: `Interview · ${interview.name}`,
        description: `${interview.role} · ${interview.interviewer}`,
        time: `${relativeLabel(interview.interviewDate)} · ${interview.interviewTime}`,
        tone: 'sky',
        link: '/recruitment',
      })
    })

    newJoiners.slice(0, 2).forEach((employee) => {
      items.push({
        id: `joiner-${employee.id}`,
        type: 'people',
        title: `New joiner · ${employee.name}`,
        description: `${employee.role} · ${employee.department}`,
        time: relativeLabel(employee.joinedOn),
        tone: 'success',
        link: '/employees',
      })
    })
  }

  const latestAnnouncement = announcements[0]
  if (latestAnnouncement) {
    items.push({
      id: `announcement-${latestAnnouncement.id}`,
      type: 'announcement',
      title: latestAnnouncement.title,
      description: latestAnnouncement.category,
      time: relativeTime(latestAnnouncement.publishedAt),
      tone: 'default',
      link: '#announcements',
    })
  }

  const nextHoliday = holidays.find((holiday) => holiday.date >= today)
  if (nextHoliday) {
    items.push({
      id: `holiday-${nextHoliday.id}`,
      type: 'holiday',
      title: nextHoliday.name,
      description: 'Upcoming company holiday',
      time: relativeLabel(nextHoliday.date),
      tone: 'success',
      link: '#holidays',
    })
  }

  return items.slice(0, 8)
}

function filterNotifications(notifications, user, scope) {
  const roleKey = scope.roleKey
  const employeeId = scope.currentEmployee?.id
  const email = String(user?.email ?? '').toLowerCase()

  return notifications
    .filter((notification) => {
      const audience = String(notification.audience ?? '').toLowerCase()
      return (
        audience === 'all' ||
        audience === roleKey ||
        (employeeId && audience === employeeId.toLowerCase()) ||
        (email && audience === email)
      )
    })
    .map((notification) => ({
      ...notification,
      unread: !notification.read,
    }))
    .sort((left, right) => {
      if (left.unread !== right.unread) {
        return left.unread ? -1 : 1
      }
      return String(right.createdAt).localeCompare(String(left.createdAt))
    })
}

function filterActivity(activity, scope) {
  if (isOrgWideRole(scope.roleKey) && scope.roleKey !== 'client') {
    return activity
  }

  if (scope.roleKey === 'manager') {
    const ids = setFrom([
      ...scope.scopeIds,
      scope.currentEmployee?.id,
    ])
    return activity.filter(
      (item) =>
        item.audience?.includes('manager') &&
        (ids.has(item.actorId) || item.audience.includes('all')),
    )
  }

  return activity.filter(
    (item) =>
      item.audience?.includes('employee') || item.audience?.includes('all'),
  )
}

function buildRecruitment(candidates, positions, today) {
  const openJobs = positions.filter(
    (position) => position.status === 'Open' || position.status === 'Urgent',
  )
  const funnel = FUNNEL_STAGES.map((stage) => ({
    stage,
    count: candidates.filter((candidate) => candidate.stage === stage).length,
  }))
  const upcomingInterviews = candidates
    .filter(
      (candidate) =>
        candidate.stage === 'Interview' &&
        candidate.interviewDate &&
        candidate.interviewDate >= today,
    )
    .sort((left, right) =>
      `${left.interviewDate}${left.interviewTime}`.localeCompare(
        `${right.interviewDate}${right.interviewTime}`,
      ),
    )
  const offers = candidates.filter((candidate) => candidate.stage === 'Offer')

  return {
    positions,
    candidates,
    openJobs,
    funnel,
    upcomingInterviews,
    offers,
    summary: {
      openJobs: openJobs.length,
      candidates: candidates.length,
      interviews: upcomingInterviews.length,
      offers: offers.length,
    },
  }
}

function buildOnboarding(records) {
  const withProgress = records.map((record) => {
    const done = record.checklist.filter((item) => item.done).length
    const total = record.checklist.length
    return {
      ...record,
      done,
      total,
      progress: total ? Math.round((done / total) * 100) : 0,
      pendingItems: record.checklist.filter((item) => !item.done),
    }
  })

  const completion = withProgress.length
    ? Math.round(
        withProgress.reduce((sum, record) => sum + record.progress, 0) /
          withProgress.length,
      )
    : 0

  return {
    records: withProgress,
    completion,
    completed: withProgress.filter((record) => record.status === 'Completed')
      .length,
    inProgress: withProgress.filter((record) => record.status !== 'Completed')
      .length,
    pendingItems: withProgress.flatMap((record) =>
      record.pendingItems.map((item) => ({
        ...item,
        recordId: record.id,
        employeeName: record.employeeName,
        employeeId: record.employeeId,
      })),
    ),
  }
}

function buildEmployeeProfile(currentEmployee, employees) {
  if (!currentEmployee) {
    return null
  }

  const manager = currentEmployee.managerId
    ? employees.find((employee) => employee.id === currentEmployee.managerId)
    : null

  return {
    ...currentEmployee,
    initials: getInitials(currentEmployee.name),
    managerName: manager?.name ?? null,
  }
}

export function buildDashboardData(user, options = {}) {
  ensureWorkspaceSeed()

  const rangeDays = options.rangeDays ?? 30
  const today = toISODate()
  const employees = getEmployees()
  const departments = getCollection(STORAGE_KEYS.departments, [])
  const branches = getCollection(STORAGE_KEYS.branches, [])
  const attendanceAll = getCollection(STORAGE_KEYS.attendance, [])
  const leaveAll = getCollection(STORAGE_KEYS.leaveRecords, [])
  const leaveBalances = getCollection(STORAGE_KEYS.leaveBalances, {})
  const timesheetsAll = getCollection(STORAGE_KEYS.timesheetEntries, [])
  const projectsAll = getCollection(STORAGE_KEYS.projects, [])
  const positions = getCollection(STORAGE_KEYS.positions, [])
  const candidates = getCollection(STORAGE_KEYS.candidates, [])
  const tasksAll = getCollection(STORAGE_KEYS.tasks, [])
  const onboardingAll = getCollection(STORAGE_KEYS.onboarding, [])
  const announcements = getCollection(STORAGE_KEYS.announcements, [])
  const holidays = getCollection(STORAGE_KEYS.holidays, [])
  const notifications = getCollection(STORAGE_KEYS.notifications, [])
  const activity = getCollection(STORAGE_KEYS.activity, [])

  const scope = resolveScope(user, employees)
  const scopeIds = setFrom(scope.scopeIds)

  const attendance = inSet(
    attendanceAll.map((record) => record.employeeId),
    scopeIds,
  ).length
    ? attendanceAll.filter((record) => scopeIds.has(record.employeeId))
    : []

  const leave = leaveAll
    .filter((record) => scopeIds.has(record.employeeId))
    .sort((left, right) => right.startDate.localeCompare(left.startDate))

  const timesheets = timesheetsAll
    .filter((entry) => scopeIds.has(entry.employeeId))
    .sort((left, right) => right.dateISO.localeCompare(left.dateISO))

  const tasks = tasksAll
    .filter((task) => scopeIds.has(task.assigneeId))
    .map((task) => normalizeTask(task, today))

  const projects = filterProjects(projectsAll, scope)
  const onboarding = buildOnboarding(
    onboardingAll.filter((record) => scopeIds.has(record.employeeId)),
  )

  const todayAttendance = attendance.filter((record) => record.date === today)

  const todayRows = scope.visibleEmployees.map((employee) => {
    const record = todayAttendance.find(
      (item) => item.employeeId === employee.id,
    )

    return {
      ...employee,
      initials: getInitials(employee.name),
      status: record?.status ?? 'Not marked',
      checkIn: record?.checkIn ?? null,
      checkOut: record?.checkOut ?? null,
      workMode: record?.workMode ?? employee.workMode,
      hours: record?.hours ?? 0,
    }
  })

  const attendanceSummary = buildAttendanceSummary(todayRows)
  const monthlyAttendance = buildMonthlyAttendance(attendance, today)
  const trend = buildTrend(attendance, rangeDays)

  const myAttendance = scope.currentEmployee
    ? attendance.filter(
        (record) => record.employeeId === scope.currentEmployee.id,
      )
    : []
  const myTodayRecord = scope.currentEmployee
    ? myAttendance.find((record) => record.date === today)
    : null
  const liveHours = myTodayRecord?.checkOut
    ? myTodayRecord.hours
    : myTodayRecord?.checkIn
      ? Math.round(hoursBetween(myTodayRecord.checkIn, nowTimeString()) * 10) / 10
      : 0

  const pendingLeave = leave.filter((record) => record.status === 'Pending')
  const upcomingLeave = leave.filter(
    (record) => record.status === 'Approved' && record.startDate >= today,
  )
  const myLeave = scope.currentEmployee
    ? leave.filter((record) => record.employeeId === scope.currentEmployee.id)
    : []

  const pendingTimesheets = timesheets.filter(
    (entry) => entry.status === 'Pending',
  )
  const myTimesheets = scope.currentEmployee
    ? timesheets.filter(
        (entry) => entry.employeeId === scope.currentEmployee.id,
      )
    : []
  const weekStart = isoOffset(-6)
  const weekHours = timesheets
    .filter((entry) => entry.dateISO >= weekStart)
    .reduce((sum, entry) => sum + entry.hours, 0)
  const approvedHours = timesheets
    .filter((entry) => entry.status === 'Approved')
    .reduce((sum, entry) => sum + entry.hours, 0)
  const totalHours = timesheets.reduce((sum, entry) => sum + entry.hours, 0)

  const overdueTasks = tasks.filter((task) => task.isOverdue)
  const dueSoonTasks = tasks.filter((task) => task.isDueSoon)
  const completedTasks = tasks.filter((task) => task.status === 'Completed')
  const myTasks = scope.currentEmployee
    ? tasks.filter((task) => task.assigneeId === scope.currentEmployee.id)
    : []
  const workload = buildWorkload(tasks, scope.visibleEmployees)

  const activeProjects = projects.filter(
    (project) => project.status !== 'Completed',
  )
  const projectSummary = {
    total: projects.length,
    active: activeProjects.length,
    atRisk: projects.filter((project) => project.status === 'At Risk').length,
    completed: projects.filter((project) => project.status === 'Completed')
      .length,
    averageProgress: projects.length
      ? Math.round(
          projects.reduce((sum, project) => sum + project.progress, 0) /
            projects.length,
        )
      : 0,
  }

  const recruitment =
    scope.roleKey === 'admin' || scope.roleKey === 'hr'
      ? buildRecruitment(candidates, positions, today)
      : buildRecruitment([], [], today)

  const approvals = buildActionItems({
    scope,
    leave,
    timesheets,
    tasks,
    onboarding: onboarding.records,
    candidates: recruitment.candidates,
    employees: scope.visibleEmployees,
    today,
  })

  const approvalCounts = {
    total: approvals.length,
    leave: approvals.filter((item) => item.kind === 'leave').length,
    timesheet: approvals.filter((item) => item.kind === 'timesheet').length,
    task: approvals.filter((item) => item.kind === 'task').length,
    onboarding: approvals.filter((item) => item.kind === 'onboarding').length,
    offer: approvals.filter((item) => item.kind === 'offer').length,
  }

  const whosOut = buildWhosOut(
    scope,
    attendanceAll,
    leaveAll,
    employees,
    today,
  )

  const myDay = buildMyDay({
    scope,
    today,
    todayRows,
    attendanceSummary,
    tasks,
    leave,
    timesheets,
    approvals,
    announcements,
    holidays,
    upcomingInterviews: recruitment.upcomingInterviews,
    newJoiners: employees.filter(
      (employee) => employee.joinedOn >= isoOffset(-30),
    ),
  })

  const newJoiners = scope.visibleEmployees.filter(
    (employee) => employee.joinedOn >= isoOffset(-30),
  )
  const exits = scope.visibleEmployees.filter(
    (employee) => employee.status === 'Exited',
  )

  const departmentDistribution = Object.entries(
    scope.visibleEmployees.reduce((accumulator, employee) => {
      accumulator[employee.department] =
        (accumulator[employee.department] ?? 0) + 1
      return accumulator
    }, {}),
  ).map(([name, value], index) => ({
    name,
    value,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }))

  const branchDistribution = Object.entries(
    scope.visibleEmployees.reduce((accumulator, employee) => {
      accumulator[employee.branch] = (accumulator[employee.branch] ?? 0) + 1
      return accumulator
    }, {}),
  ).map(([name, value], index) => ({
    name,
    value,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }))

  const visibleAnnouncements = [...announcements].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1
    }
    return String(right.publishedAt).localeCompare(String(left.publishedAt))
  })

  const upcomingHolidays = holidays
    .filter((holiday) => holiday.date >= today)
    .sort(sortByDateAsc)

  const recentActivity = filterActivity(activity, scope)
    .sort((left, right) =>
      String(right.createdAt).localeCompare(String(left.createdAt)),
    )
    .slice(0, 8)

  const attentionRecords = []
  if (scope.roleKey === 'admin' || scope.roleKey === 'hr') {
    onboarding.records.forEach((record) => {
      if (record.pendingItems.length > 0) {
        attentionRecords.push({
          id: `onboarding-${record.id}`,
          employeeId: record.employeeId,
          name: record.employeeName,
          department: record.department,
          reason: `${record.pendingItems.length} onboarding item${
            record.pendingItems.length === 1 ? '' : 's'
          } pending`,
          severity: record.pendingItems.length > 2 ? 'high' : 'medium',
          link: '/?focus=onboarding',
        })
      }
    })

    scope.visibleEmployees.forEach((employee) => {
      if (employee.status === 'On Leave') {
        const approved = leaveAll.some(
          (record) =>
            record.employeeId === employee.id &&
            record.status === 'Approved' &&
            record.startDate <= today &&
            record.endDate >= today,
        )

        if (!approved) {
          attentionRecords.push({
            id: `record-${employee.id}`,
            employeeId: employee.id,
            name: employee.name,
            department: employee.department,
            reason: 'On leave without an approved leave record',
            severity: 'high',
            link: '/employees',
          })
        }
      }
    })
  }

  const profile = buildEmployeeProfile(scope.currentEmployee, employees)
  const balances = profile ? leaveBalances[profile.id] ?? [] : []

  const notificationsForUser = filterNotifications(notifications, user, scope)

  const metrics = {
    totalEmployees: scope.visibleEmployees.length,
    activeEmployees: scope.visibleEmployees.filter(
      (employee) => employee.status === 'Active',
    ).length,
    onLeaveEmployees: scope.visibleEmployees.filter(
      (employee) => employee.status === 'On Leave',
    ).length,
    departments: unique(
      scope.visibleEmployees.map((employee) => employee.department),
    ).length,
    branches: isOrgWideRole(scope.roleKey)
      ? branches.length
      : unique(scope.visibleEmployees.map((employee) => employee.branch))
          .length,
    newJoiners: newJoiners.length,
    exits: exits.length,
    attendance: attendanceSummary,
    monthlyAttendance,
    leave: {
      pending: pendingLeave.length,
      approved: leave.filter((record) => record.status === 'Approved').length,
      rejected: leave.filter((record) => record.status === 'Rejected').length,
      upcoming: upcomingLeave.length,
      balances,
    },
    timesheets: {
      totalHours,
      weekHours: Math.round(weekHours * 10) / 10,
      pending: pendingTimesheets.length,
      approved: timesheets.filter((entry) => entry.status === 'Approved')
        .length,
      draft: timesheets.filter((entry) => entry.status === 'Draft').length,
      completion: totalHours
        ? Math.round((approvedHours / totalHours) * 100)
        : 0,
    },
    tasks: {
      total: tasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      dueSoon: dueSoonTasks.length,
      inProgress: tasks.filter((task) => task.status === 'In Progress').length,
      todo: tasks.filter((task) => task.status === 'Todo').length,
      completion: tasks.length
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0,
    },
    projects: projectSummary,
    recruitment: recruitment.summary,
    onboarding: {
      total: onboarding.records.length,
      completed: onboarding.completed,
      inProgress: onboarding.inProgress,
      completion: onboarding.completion,
      pendingItems: onboarding.pendingItems.length,
    },
    approvals: approvalCounts,
  }

  return {
    roleKey: scope.roleKey,
    roleLabel: scope.roleLabel,
    user,
    scope: {
      label: scope.scopeLabel,
      employeeIds: scope.scopeIds,
      isOrgWide: scope.isOrgWide,
      teamSize: scope.visibleEmployees.length,
    },
    employee: profile,
    employees: scope.visibleEmployees,
    departments,
    branches,
    metrics,
    attendance: {
      today: todayRows,
      todayRecord: myTodayRecord ?? null,
      liveHours,
      summary: attendanceSummary,
      trend,
      monthly: monthlyAttendance,
      history: [...myAttendance].sort(sortByDateDesc).slice(0, 12),
    },
    leave: {
      records: leave,
      pending: pendingLeave,
      upcoming: upcomingLeave,
      mine: myLeave,
      balances,
    },
    timesheets: {
      entries: timesheets,
      pending: pendingTimesheets,
      mine: myTimesheets,
      summary: metrics.timesheets,
    },
    tasks: {
      all: tasks,
      mine: myTasks,
      overdue: overdueTasks,
      dueSoon: dueSoonTasks,
      completed: completedTasks,
      workload,
    },
    projects,
    recruitment,
    onboarding,
    approvals,
    whosOut,
    myDay,
    notifications: notificationsForUser,
    unreadNotifications: notificationsForUser.filter(
      (notification) => notification.unread,
    ).length,
    announcements: visibleAnnouncements.slice(0, 4),
    holidays: upcomingHolidays,
    activity: recentActivity,
    attentionRecords,
    departmentDistribution,
    branchDistribution,
    rangeDays,
    today,
  }
}

export async function getDashboardData(user, options = {}) {
  await delay(180)
  return buildDashboardData(user, options)
}

export function getNotificationsForUser(user) {
  ensureWorkspaceSeed()
  const employees = getEmployees()
  const scope = resolveScope(user, employees)
  const notifications = getCollection(STORAGE_KEYS.notifications, [])
  return filterNotifications(notifications, user, scope)
}

export function markAllNotificationsRead(user) {
  const visible = getNotificationsForUser(user)
  const ids = new Set(visible.map((notification) => notification.id))

  updateCollection(STORAGE_KEYS.notifications, (notifications) =>
    notifications.map((notification) =>
      ids.has(notification.id)
        ? { ...notification, read: true }
        : notification,
    ),
  )
}

export function approveLeave(id) {
  return updateLeaveStatus(id, 'Approved')
}

export function rejectLeave(id) {
  return updateLeaveStatus(id, 'Rejected')
}

export function approveTimesheet(id) {
  return updateTimesheetStatus(id, 'Approved')
}

export function rejectTimesheet(id) {
  return updateTimesheetStatus(id, 'Rejected')
}

export { markNotificationRead, subscribeToWorkspace }
