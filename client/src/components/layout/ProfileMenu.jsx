import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock,
  LayoutDashboard,
  LogOut,
  Mail,
} from 'lucide-react'
import { roleBadgeClass } from '../../config/roles'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar } from '../dashboard/ui'

const MENU_LINKS = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'My attendance', to: '/attendance', icon: Clock },
  { label: 'My leave', to: '/leave', icon: CalendarDays },
  { label: 'My timesheets', to: '/timesheets', icon: ClipboardList },
]

export function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

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

  const goTo = (path) => {
    setOpen(false)
    navigate(path)
  }

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) {
    return null
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Open profile menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-xs font-semibold text-slate-800">
            {user.name}
          </span>
          <span className="block text-[10px] font-medium text-slate-500">
            {user.role}
          </span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={user.name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>
            <span
              className={`mt-2.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeClass(
                user.role,
              )}`}
            >
              {user.role}
            </span>
          </div>

          <div className="p-1.5">
            {MENU_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => goTo(link.to)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {link.label}
                </button>
              )
            })}
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <a
              href={`mailto:${user.email}`}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Mail className="h-4 w-4 text-slate-400" />
              Contact support
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
