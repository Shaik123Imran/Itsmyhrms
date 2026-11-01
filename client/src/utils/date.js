export const DAY_MS = 24 * 60 * 60 * 1000

export function startOfDay(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function toISODate(value = new Date()) {
  const date = startOfDay(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromISODate(value) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return startOfDay(value)
  }

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function addDays(value, amount) {
  const date = startOfDay(value)
  date.setDate(date.getDate() + amount)
  return date
}

export function isoOffset(amount, base = new Date()) {
  return toISODate(addDays(base, amount))
}

export function formatDate(
  value,
  options = { month: 'short', day: 'numeric', year: 'numeric' },
) {
  const date = fromISODate(value)
  if (!date) {
    return '—'
  }
  return date.toLocaleDateString('en-US', options)
}

export function formatTime(value) {
  const date = value instanceof Date ? value : fromISODate(value)
  if (!date) {
    return '—'
  }
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function nowTimeString() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`
}

export function formatClockTime(value) {
  const minutes = timeToMinutes(value)
  if (minutes === null) {
    return '—'
  }

  const date = new Date()
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isWeekend(value) {
  const date = fromISODate(value)
  return date ? date.getDay() === 0 || date.getDay() === 6 : false
}

export function diffInDays(from, to) {
  const start = fromISODate(from)
  const end = fromISODate(to)
  if (!start || !end) {
    return 0
  }
  return Math.round((end - start) / DAY_MS)
}

export function listDates(start, end) {
  const first = fromISODate(start)
  const last = fromISODate(end)
  if (!first || !last || last < first) {
    return []
  }

  const dates = []
  let cursor = first
  while (cursor <= last) {
    dates.push(toISODate(cursor))
    cursor = addDays(cursor, 1)
  }
  return dates
}

export function workingDaysBetween(start, end) {
  return listDates(start, end).filter((date) => !isWeekend(date)).length
}

export function monthKey(value = new Date()) {
  const date = fromISODate(value)
  if (!date) {
    return ''
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(value = new Date()) {
  const date = fromISODate(value)
  if (!date) {
    return ''
  }
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function startOfMonth(value = new Date()) {
  const date = fromISODate(value)
  if (!date) {
    return null
  }
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(value = new Date()) {
  const date = fromISODate(value)
  if (!date) {
    return null
  }
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function relativeLabel(value) {
  const date = fromISODate(value)
  if (!date) {
    return '—'
  }

  const today = startOfDay()
  const diff = Math.round((date - today) / DAY_MS)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff <= 7) return `In ${diff} days`
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days overdue`
  return formatDate(value, { month: 'short', day: 'numeric' })
}

export function relativeTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(toISODate(date), { month: 'short', day: 'numeric' })
}

export function timeToMinutes(value) {
  if (!value) {
    return null
  }
  const [hours, minutes] = String(value).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }
  return hours * 60 + minutes
}

export function hoursBetween(checkIn, checkOut) {
  const start = timeToMinutes(checkIn)
  const end = timeToMinutes(checkOut)
  if (start === null || end === null || end < start) {
    return 0
  }
  return Math.round(((end - start) / 60) * 10) / 10
}

export function isToday(value) {
  return toISODate(value) === toISODate()
}

export function compareISO(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''))
}
