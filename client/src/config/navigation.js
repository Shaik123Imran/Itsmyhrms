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

export const DASHBOARD_LINK = {
  label: 'Dashboard',
  to: '/',
  icon: LayoutDashboard,
}

export const ROLE_LINKS = {
  'HR Head': [
    { label: 'Employees', to: '/employees', icon: Users },
    { label: 'Recruitment', to: '/recruitment', icon: Briefcase },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
  ],
  'Project Manager': [
    { label: 'Projects', to: '/projects', icon: FolderKanban },
    { label: 'Employees', to: '/employees', icon: Users },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
  ],
  Employee: [
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
  ],
  CEO: [
    { label: 'Employees', to: '/employees', icon: Users },
    { label: 'Recruitment', to: '/recruitment', icon: Briefcase },
    { label: 'Leave', to: '/leave', icon: CalendarDays },
    { label: 'Attendance', to: '/attendance', icon: Clock },
    { label: 'Timesheets', to: '/timesheets', icon: ClipboardList },
    { label: 'Projects', to: '/projects', icon: FolderKanban },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'CRM', to: '/crm', icon: Handshake },
  ],
}

export const ROUTE_ACCESS = Object.entries(ROLE_LINKS).reduce(
  (access, [role, links]) => {
    links.forEach((link) => {
      const moduleKey = link.to.slice(1)
      access[moduleKey] = [...(access[moduleKey] ?? []), role]
    })
    return access
  },
  {},
)

export function getNavigationForRole(role) {
  return [DASHBOARD_LINK, ...(ROLE_LINKS[role] ?? [])]
}
