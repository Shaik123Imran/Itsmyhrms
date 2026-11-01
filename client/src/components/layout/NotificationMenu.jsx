import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  CalendarDays,
  CheckCheck,
  Clock,
  Inbox,
  ListTodo,
  Megaphone,
  PartyPopper,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToWorkspace,
} from '../../services/dashboardService'
import { relativeTime } from '../../utils/date'
import { navigateTo } from '../../utils/navigation'

const TYPE_ICONS = {
  approval: CheckCheck,
  interview: Briefcase,
  leave: CalendarDays,
  onboarding: UserCheck,
  timesheet: Clock,
  task: ListTodo,
  announcement: Megaphone,
  holiday: PartyPopper,
}

const TYPE_STYLES = {
  approval: 'bg-amber-50 text-amber-600',
  interview: 'bg-sky-50 text-sky-600',
  leave: 'bg-violet-50 text-violet-600',
  onboarding: 'bg-emerald-50 text-emerald-600',
  timesheet: 'bg-indigo-50 text-indigo-600',
  task: 'bg-rose-50 text-rose-600',
  announcement: 'bg-slate-100 text-slate-600',
  holiday: 'bg-emerald-50 text-emerald-600',
}

export function NotificationMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    const refresh = () => {
      setNotifications(getNotificationsForUser(user))
    }

    refresh()
    return subscribeToWorkspace(refresh)
  }, [user])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const unread = notifications.filter((notification) => !notification.read)

  const handleOpenNotification = (notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id)
    }
    setOpen(false)
    navigateTo(navigate, notification.link)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Notifications
              </p>
              <p className="text-[11px] text-slate-500">
                {unread.length > 0
                  ? `${unread.length} unread update${
                      unread.length === 1 ? '' : 's'
                    }`
                  : 'You are all caught up'}
              </p>
            </div>
            {unread.length > 0 ? (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(user)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Inbox className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Updates about approvals, leave, and people will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const Icon = TYPE_ICONS[notification.type] ?? Bell
                  const iconStyle =
                    TYPE_STYLES[notification.type] ??
                    'bg-slate-100 text-slate-600'

                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleOpenNotification(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                          notification.read ? 'opacity-70' : ''
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconStyle}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800">
                              {notification.title}
                            </span>
                            {!notification.read ? (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                            {notification.message}
                          </span>
                          <span className="mt-1 block text-[10px] font-medium text-slate-400">
                            {relativeTime(notification.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
