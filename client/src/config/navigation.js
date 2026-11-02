import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Clock,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import { getRoleKey } from './roles'

export const DASHBOARD_LINK = {
  label: 'Dashboard',
  to: '/',
  icon: LayoutDashboard,
}

export const ROLE_LINKS = {
  admin: [
    { label: 'Employees', to: '/employees', icon: Users },
    { label: 'Recruitment', to: '/recruitment', icon: Briefcase },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
    { label: 'Projects', to: '/projects', icon: FolderKanban },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'CRM', to: '/crm', icon: Handshake },
  ],
  hr: [
    { label: 'Employees', to: '/employees', icon: Users },
    { label: 'Recruitment', to: '/recruitment', icon: Briefcase },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
  ],
  manager: [
    { label: 'Projects', to: '/projects', icon: FolderKanban },
    { label: 'Employees', to: '/employees', icon: Users },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
  ],
  employee: [
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
  ],
  finance: [
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
  ],
  sales: [
    { label: 'CRM', to: '/crm', icon: Handshake },
    { label: 'Projects', to: '/projects', icon: FolderKanban },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
  ],
  client: [{ label: 'Projects', to: '/projects', icon: FolderKanban }],
}

export const ROUTE_ACCESS = Object.entries(ROLE_LINKS).reduce(
  (access, [roleKey, links]) => {
    links.forEach((link) => {
      const moduleKey = link.to.slice(1)
      access[moduleKey] = [...(access[moduleKey] ?? []), roleKey]
    })
    return access
  },
  {},
)

export function getNavigationForRole(role) {
  return [DASHBOARD_LINK, ...(ROLE_LINKS[getRoleKey(role)] ?? [])]
}
