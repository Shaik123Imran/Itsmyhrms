import {
  SEED_ACTIVITY,
  SEED_ANNOUNCEMENTS,
  SEED_BRANCHES,
  SEED_CANDIDATES,
  SEED_DEPARTMENTS,
  SEED_EMPLOYEES,
  SEED_HOLIDAYS,
  SEED_LEAVE_BALANCES,
  SEED_LEAVE_RECORDS,
  SEED_NOTIFICATIONS,
  SEED_ONBOARDING,
  SEED_POSITIONS,
  SEED_PROJECTS,
  SEED_TASKS,
  SEED_TIMESHEET_ENTRIES,
} from '../data/seed'
import {
  addDays,
  fromISODate,
  hoursBetween,
  isWeekend,
  nowTimeString,
  toISODate,
} from '../utils/date'

export const STORAGE_KEYS = {
  employees: 'itshrms.employees',
  departments: 'itshrms.departments',
  branches: 'itshrms.branches',
  attendance: 'itshrms.attendance',
  leaveRecords: 'itshrms.leaveRequests',
  leaveBalances: 'itshrms.leaveBalances',
  timesheetEntries: 'itshrms.timesheets',
  projects: 'itshrms.projects',
  positions: 'itshrms.recruitment.positions',
  candidates: 'itshrms.recruitment.candidates',
  tasks: 'itshrms.tasks',
  onboarding: 'itshrms.onboarding',
  announcements: 'itshrms.announcements',
  holidays: 'itshrms.holidays',
  notifications: 'itshrms.notifications',
  activity: 'itshrms.activity',
}

const CHANGE_EVENT = 'itshrms:datachange'
let seedReady = false

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readRaw(key) {
  if (!hasStorage()) {
    return undefined
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function writeRaw(key, value) {
  if (!hasStorage()) {
    return
  }

  try {
    const next = JSON.stringify(value)
    const current = window.localStorage.getItem(key)
    if (current === next) {
      return
    }
    window.localStorage.setItem(key, next)
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }))
  } catch {
    return
  }
}

function sameShape(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function writeIfChanged(key, next, previous) {
  if (!sameShape(next, previous)) {
    writeRaw(key, next)
  }
}

function isArray(value) {
  return Array.isArray(value)
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function defaultEmail(name) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@itshrms.com`
}

function branchForDepartment(department) {
  if (department === 'Sales') return 'Mumbai Office'
  if (department === 'Finance') return 'Remote'
  return 'Bengaluru HQ'
}

function parseLegacyLeaveDates(value) {
  const today = new Date()
  if (!value) {
    return { startDate: toISODate(today), endDate: toISODate(today) }
  }

  const cleaned = String(value).replace(/\s+/g, ' ').trim()
  const yearMatch = cleaned.match(/(\d{4})/)
  const year = yearMatch ? Number(yearMatch[1]) : today.getFullYear()
  const parts = cleaned.split(' - ')

  const parsePart = (part) => {
    const normalized = part.replace(/,\s*\d{4}/, '').trim()
    const date = new Date(`${normalized}, ${year}`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (parts.length === 2) {
    const start = parsePart(parts[0])
    const end = parsePart(parts[1])
    if (start && end) {
      return { startDate: toISODate(start), endDate: toISODate(end) }
    }
  }

  const single = parsePart(parts[0])
  if (single) {
    return { startDate: toISODate(single), endDate: toISODate(single) }
  }

  return { startDate: toISODate(today), endDate: toISODate(today) }
}

function parseLegacyTimesheetDate(value) {
  if (!value) {
    return toISODate()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? toISODate() : toISODate(parsed)
}

function ensureEmployees() {
  const existing = readRaw(STORAGE_KEYS.employees)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.employees, SEED_EMPLOYEES)
    return
  }

  let changed = false
  const next = existing.map((employee) => {
    const seedMatch = SEED_EMPLOYEES.find((seed) => seed.id === employee.id)
    const merged = {
      ...(seedMatch ?? {}),
      ...employee,
    }

    const enriched = {
      ...merged,
      email: merged.email || defaultEmail(merged.name || 'employee'),
      managerId: merged.managerId ?? null,
      branch: merged.branch || branchForDepartment(merged.department),
      workMode: merged.workMode || 'Office',
      joinedOn: merged.joinedOn || toISODate(),
      status: merged.status || 'Active',
    }

    if (!sameShape(enriched, employee)) {
      changed = true
    }

    return enriched
  })

  if (changed) {
    writeRaw(STORAGE_KEYS.employees, next)
  }
}

function ensureDepartments() {
  const existing = readRaw(STORAGE_KEYS.departments)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.departments, SEED_DEPARTMENTS)
  }
}

function ensureBranches() {
  const existing = readRaw(STORAGE_KEYS.branches)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.branches, SEED_BRANCHES)
  }
}

function ensureLeaveRecords() {
  const existing = readRaw(STORAGE_KEYS.leaveRecords)
  const base = isArray(existing) ? existing : []

  const normalized = base.map((record, index) => {
    const fallbackDates = parseLegacyLeaveDates(record.dates)
    const startDate = record.startDate || fallbackDates.startDate
    const endDate = record.endDate || fallbackDates.endDate
    const start = fromISODate(startDate)
    const end = fromISODate(endDate)
    const computedDays =
      start && end ? Math.max(1, Math.round((end - start) / 86400000) + 1) : 1

    return {
      ...record,
      id: record.id || `LV-LEGACY-${index + 1}`,
      employeeId: record.employeeId || 'EMP-1024',
      employeeName: record.employeeName || 'Neha Kapoor',
      type: record.type || 'Casual Leave',
      startDate,
      endDate,
      days: record.days || computedDays,
      status: record.status || 'Pending',
      reason: record.reason || '',
      appliedOn: record.appliedOn || startDate,
      reviewedOn: record.reviewedOn ?? null,
    }
  })

  const seen = new Set(
    normalized.map(
      (record) =>
        `${record.employeeId}|${record.type}|${record.startDate}|${record.endDate}`,
    ),
  )

  SEED_LEAVE_RECORDS.forEach((record) => {
    const key = `${record.employeeId}|${record.type}|${record.startDate}|${record.endDate}`
    if (!seen.has(key) && !normalized.some((item) => item.id === record.id)) {
      normalized.push(record)
      seen.add(key)
    }
  })

  writeIfChanged(STORAGE_KEYS.leaveRecords, normalized, existing)
}

function ensureLeaveBalances() {
  const existing = readRaw(STORAGE_KEYS.leaveBalances)
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    writeRaw(STORAGE_KEYS.leaveBalances, SEED_LEAVE_BALANCES)
    return
  }

  const next = { ...existing }
  Object.entries(SEED_LEAVE_BALANCES).forEach(([employeeId, balances]) => {
    if (!next[employeeId]) {
      next[employeeId] = balances
    }
  })

  writeIfChanged(STORAGE_KEYS.leaveBalances, next, existing)
}

function ensureTimesheetEntries() {
  const existing = readRaw(STORAGE_KEYS.timesheetEntries)
  const base = isArray(existing) ? existing : []

  const normalized = base.map((entry, index) => {
    const dateISO = entry.dateISO || parseLegacyTimesheetDate(entry.date)
    return {
      ...entry,
      id: entry.id || `TS-LEGACY-${index + 1}`,
      employeeId: entry.employeeId || 'EMP-1024',
      employeeName: entry.employeeName || 'Neha Kapoor',
      dateISO,
      date: entry.date || dateISO,
      project: entry.project || 'Internal',
      task: entry.task || 'General work',
      hours: Number(entry.hours) || 0,
      status: entry.status || 'Draft',
    }
  })

  const seen = new Set(
    normalized.map(
      (entry) => `${entry.employeeId}|${entry.dateISO}|${entry.task}`,
    ),
  )

  SEED_TIMESHEET_ENTRIES.forEach((entry) => {
    const key = `${entry.employeeId}|${entry.dateISO}|${entry.task}`
    if (!seen.has(key) && !normalized.some((item) => item.id === entry.id)) {
      normalized.push(entry)
      seen.add(key)
    }
  })

  writeIfChanged(STORAGE_KEYS.timesheetEntries, normalized, existing)
}

function ensureProjects() {
  const existing = readRaw(STORAGE_KEYS.projects)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.projects, SEED_PROJECTS)
  }
}

function ensurePositions() {
  const existing = readRaw(STORAGE_KEYS.positions)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.positions, SEED_POSITIONS)
    return
  }

  let changed = false
  const next = existing.map((position, index) => {
    if (position.id) {
      return position
    }
    changed = true
    return { ...position, id: `JOB-LEGACY-${index + 1}` }
  })

  if (changed) {
    writeRaw(STORAGE_KEYS.positions, next)
  }
}

function ensureCandidates() {
  const existing = readRaw(STORAGE_KEYS.candidates)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.candidates, SEED_CANDIDATES)
  }
}

function ensureTasks() {
  const existing = readRaw(STORAGE_KEYS.tasks)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.tasks, SEED_TASKS)
  }
}

function ensureOnboarding() {
  const existing = readRaw(STORAGE_KEYS.onboarding)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.onboarding, SEED_ONBOARDING)
  }
}

function ensureAnnouncements() {
  const existing = readRaw(STORAGE_KEYS.announcements)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.announcements, SEED_ANNOUNCEMENTS)
  }
}

function ensureHolidays() {
  const existing = readRaw(STORAGE_KEYS.holidays)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.holidays, SEED_HOLIDAYS)
  }
}

function ensureNotifications() {
  const existing = readRaw(STORAGE_KEYS.notifications)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.notifications, SEED_NOTIFICATIONS)
  }
}

function ensureActivity() {
  const existing = readRaw(STORAGE_KEYS.activity)
  if (!isArray(existing) || existing.length === 0) {
    writeRaw(STORAGE_KEYS.activity, SEED_ACTIVITY)
  }
}

const TODAY_ATTENDANCE_OVERRIDES = {
  'EMP-1042': { status: 'Present', checkIn: '09:12' },
  'EMP-1038': { status: 'Late', checkIn: '09:41' },
  'EMP-1019': { status: 'On Leave', checkIn: null },
  'EMP-1007': { status: 'Remote', checkIn: '09:05' },
}

function statusForDate(employeeId, dateISO) {
  const bucket = hashString(`${employeeId}-${dateISO}`) % 100
  if (bucket < 7) return 'Absent'
  if (bucket < 16) return 'Late'
  if (bucket < 28) return 'Remote'
  return 'Present'
}

function timesForStatus(status, seed, isToday) {
  if (status === 'Absent' || status === 'On Leave') {
    return { checkIn: null, checkOut: null }
  }

  if (status === 'Late') {
    return {
      checkIn: `09:${String(35 + (seed % 24)).padStart(2, '0')}`,
      checkOut: isToday ? null : `18:${String(5 + (seed % 26)).padStart(2, '0')}`,
    }
  }

  if (status === 'Remote') {
    return {
      checkIn: `09:${String(seed % 16).padStart(2, '0')}`,
      checkOut: isToday ? null : `18:${String(seed % 26).padStart(2, '0')}`,
    }
  }

  return {
    checkIn: `09:${String(seed % 21).padStart(2, '0')}`,
    checkOut: isToday ? null : `18:${String(seed % 31).padStart(2, '0')}`,
  }
}

function approvedLeaveOn(leaveRecords, employeeId, dateISO) {
  return leaveRecords.some(
    (record) =>
      record.employeeId === employeeId &&
      record.status === 'Approved' &&
      record.startDate <= dateISO &&
      record.endDate >= dateISO,
  )
}

function buildAttendanceRecord(employee, dateISO, status, options = {}) {
  const { isToday = false, checkIn = null, checkOut = null } = options
  const seed = hashString(`${employee.id}-${dateISO}`)
  const times =
    checkIn || status === 'Absent' || status === 'On Leave'
      ? { checkIn, checkOut }
      : timesForStatus(status, seed, isToday)

  return {
    id: `${employee.id}-${dateISO}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    date: dateISO,
    status,
    checkIn: times.checkIn,
    checkOut: times.checkOut,
    workMode: status === 'Remote' ? 'Remote' : 'Office',
    hours: hoursBetween(times.checkIn, times.checkOut),
  }
}

function ensureAttendance() {
  const existing = readRaw(STORAGE_KEYS.attendance)
  const records = isArray(existing) ? existing : []
  const employees = readRaw(STORAGE_KEYS.employees) ?? []
  const leaveRecords = readRaw(STORAGE_KEYS.leaveRecords) ?? []
  const today = toISODate()
  const todayDate = fromISODate(today)

  const existingKeys = new Set(records.map((record) => record.id))
  const latest = records.reduce(
    (max, record) => (record.date > max ? record.date : max),
    '',
  )

  const start = latest
    ? toISODate(addDays(fromISODate(latest), 1))
    : toISODate(addDays(todayDate, -59))

  const generated = []

  for (
    let cursor = fromISODate(start);
    cursor && cursor <= todayDate;
    cursor = addDays(cursor, 1)
  ) {
    const dateISO = toISODate(cursor)
    const isToday = dateISO === today

    if (isWeekend(dateISO) && !isToday) {
      continue
    }

    employees.forEach((employee) => {
      if (dateISO < (employee.joinedOn || dateISO)) {
        return
      }

      if (existingKeys.has(`${employee.id}-${dateISO}`)) {
        return
      }

      if (isToday) {
        const override = TODAY_ATTENDANCE_OVERRIDES[employee.id]
        if (!override) {
          return
        }
        const record = buildAttendanceRecord(employee, dateISO, override.status, {
          isToday: true,
          checkIn: override.checkIn,
          checkOut: null,
        })
        generated.push(record)
        return
      }

      const status = approvedLeaveOn(leaveRecords, employee.id, dateISO)
        ? 'On Leave'
        : statusForDate(employee.id, dateISO)
      generated.push(buildAttendanceRecord(employee, dateISO, status))
    })
  }

  if (generated.length > 0) {
    writeRaw(STORAGE_KEYS.attendance, [...records, ...generated])
  }
}

export function ensureWorkspaceSeed() {
  if (seedReady) {
    return
  }

  ensureEmployees()
  ensureDepartments()
  ensureBranches()
  ensureLeaveRecords()
  ensureLeaveBalances()
  ensureTimesheetEntries()
  ensureProjects()
  ensurePositions()
  ensureCandidates()
  ensureTasks()
  ensureOnboarding()
  ensureAnnouncements()
  ensureHolidays()
  ensureNotifications()
  ensureActivity()
  ensureAttendance()

  seedReady = true
}

export function getCollection(key, fallback = []) {
  ensureWorkspaceSeed()
  const value = readRaw(key)
  return value ?? fallback
}

export function setCollection(key, value) {
  writeRaw(key, value)
  return value
}

export function updateCollection(key, updater) {
  ensureWorkspaceSeed()
  const current = readRaw(key) ?? []
  const next =
    typeof updater === 'function' ? updater(current) : updater
  writeRaw(key, next)
  return next
}

export function subscribeToWorkspace(listener) {
  if (!hasStorage()) {
    return () => {}
  }

  const handler = (event) => {
    if (event.type === 'storage' && event.key && !event.key.startsWith('itshrms.')) {
      return
    }
    listener(event)
  }

  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function getEmployees() {
  return getCollection(STORAGE_KEYS.employees, [])
}

export function getCurrentEmployee(user, employees = getEmployees()) {
  if (!user) {
    return null
  }

  const email = String(user.email ?? '').toLowerCase()
  const name = String(user.name ?? '').toLowerCase()

  return (
    employees.find(
      (employee) => String(employee.email ?? '').toLowerCase() === email,
    ) ||
    employees.find(
      (employee) => String(employee.name ?? '').toLowerCase() === name,
    ) ||
    null
  )
}

export function getTeamMembers(managerId, employees = getEmployees()) {
  if (!managerId) {
    return []
  }
  return employees.filter((employee) => employee.managerId === managerId)
}

export function getInitials(name) {
  return initials(name)
}

export function checkIn(user) {
  ensureWorkspaceSeed()
  const employees = getEmployees()
  const employee = getCurrentEmployee(user, employees)

  if (!employee) {
    throw new Error('No employee profile is linked to this account.')
  }

  const today = toISODate()
  const attendance = getCollection(STORAGE_KEYS.attendance, [])
  const existing = attendance.find(
    (record) => record.employeeId === employee.id && record.date === today,
  )

  if (existing?.checkIn) {
    return existing
  }

  const time = nowTimeString()
  const minutes = Number(time.split(':')[0]) * 60 + Number(time.split(':')[1])
  const status = minutes > 9 * 60 + 30 ? 'Late' : 'Present'

  const record = {
    id: `${employee.id}-${today}`,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    date: today,
    status,
    checkIn: time,
    checkOut: null,
    workMode: employee.workMode === 'Remote' ? 'Remote' : 'Office',
    hours: 0,
  }

  const next = existing
    ? attendance.map((item) =>
        item.id === existing.id ? { ...item, ...record } : item,
      )
    : [...attendance, record]

  setCollection(STORAGE_KEYS.attendance, next)
  return record
}

export function checkOut(user) {
  ensureWorkspaceSeed()
  const employees = getEmployees()
  const employee = getCurrentEmployee(user, employees)

  if (!employee) {
    throw new Error('No employee profile is linked to this account.')
  }

  const today = toISODate()
  const attendance = getCollection(STORAGE_KEYS.attendance, [])
  const existing = attendance.find(
    (record) => record.employeeId === employee.id && record.date === today,
  )

  if (!existing?.checkIn) {
    throw new Error('Check in first before checking out.')
  }

  if (existing.checkOut) {
    return existing
  }

  const time = nowTimeString()
  const updated = {
    ...existing,
    checkOut: time,
    hours: hoursBetween(existing.checkIn, time),
  }

  setCollection(
    STORAGE_KEYS.attendance,
    attendance.map((item) => (item.id === existing.id ? updated : item)),
  )

  return updated
}

export function updateLeaveStatus(id, status) {
  return updateCollection(STORAGE_KEYS.leaveRecords, (records) =>
    records.map((record) =>
      record.id === id
        ? { ...record, status, reviewedOn: toISODate() }
        : record,
    ),
  )
}

export function updateTimesheetStatus(id, status) {
  return updateCollection(STORAGE_KEYS.timesheetEntries, (entries) =>
    entries.map((entry) =>
      entry.id === id
        ? { ...entry, status, reviewedOn: toISODate() }
        : entry,
    ),
  )
}

export function createTask(payload, user) {
  ensureWorkspaceSeed()
  const employees = getEmployees()
  const assignee = employees.find(
    (employee) => employee.id === payload.assigneeId,
  )

  const task = {
    id: `TASK-${Date.now()}`,
    title: payload.title,
    project: payload.project || 'Internal',
    assigneeId: payload.assigneeId,
    assigneeName: assignee?.name ?? 'Unassigned',
    assigneeInitials: initials(assignee?.name ?? 'UA'),
    status: 'Todo',
    priority: payload.priority || 'Medium',
    dueDate: payload.dueDate || toISODate(),
    createdBy: user?.name ?? 'Manager',
    description: payload.description || '',
    createdAt: toISODate(),
    completedAt: null,
  }

  updateCollection(STORAGE_KEYS.tasks, (tasks) => [task, ...tasks])
  return task
}

export function completeTask(id) {
  return updateCollection(STORAGE_KEYS.tasks, (tasks) =>
    tasks.map((task) =>
      task.id === id
        ? { ...task, status: 'Completed', completedAt: toISODate() }
        : task,
    ),
  )
}

export function createDepartment(payload) {
  ensureWorkspaceSeed()
  const department = {
    id: `DEP-${Date.now()}`,
    name: payload.name,
    branch: payload.branch || 'Bengaluru HQ',
    description: payload.description || '',
  }

  updateCollection(STORAGE_KEYS.departments, (departments) => [
    department,
    ...departments,
  ])

  return department
}

export function scheduleInterview(candidateId, date, time) {
  return updateCollection(STORAGE_KEYS.candidates, (candidates) =>
    candidates.map((candidate) =>
      candidate.id === candidateId
        ? {
            ...candidate,
            stage: 'Interview',
            interviewDate: date,
            interviewTime: time,
          }
        : candidate,
    ),
  )
}

export function toggleOnboardingItem(recordId, itemId) {
  return updateCollection(STORAGE_KEYS.onboarding, (records) =>
    records.map((record) => {
      if (record.id !== recordId) {
        return record
      }

      const checklist = record.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      )
      const completed = checklist.every((item) => item.done)

      return {
        ...record,
        checklist,
        status: completed ? 'Completed' : 'In Progress',
      }
    }),
  )
}

export function markNotificationRead(id) {
  return updateCollection(STORAGE_KEYS.notifications, (notifications) =>
    notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    ),
  )
}
