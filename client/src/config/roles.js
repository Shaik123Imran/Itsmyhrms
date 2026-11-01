export const ROLE_KEYS = {
  CEO: 'admin',
  Admin: 'admin',
  Administrator: 'admin',
  'HR Head': 'hr',
  HR: 'hr',
  'HR Manager': 'hr',
  'Project Manager': 'manager',
  Manager: 'manager',
  'Team Lead': 'manager',
  Employee: 'employee',
  Staff: 'employee',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  hr: 'HR',
  manager: 'Manager',
  employee: 'Employee',
}

export const ROLE_SUBTITLES = {
  admin: 'Organization command center',
  hr: 'People operations dashboard',
  manager: 'Team management dashboard',
  employee: 'My workday dashboard',
}

export function getRoleKey(role) {
  return ROLE_KEYS[role] ?? 'employee'
}

export function getRoleLabel(role) {
  return ROLE_LABELS[getRoleKey(role)]
}

export function isOrgRole(role) {
  const roleKey = getRoleKey(role)
  return roleKey === 'admin' || roleKey === 'hr'
}

export function canManagePeople(role) {
  return isOrgRole(role)
}

export function canApproveForRole(role) {
  const roleKey = getRoleKey(role)
  return roleKey === 'admin' || roleKey === 'hr' || roleKey === 'manager'
}

export function roleBadgeClass(role) {
  const roleKey = getRoleKey(role)
  if (roleKey === 'admin') return 'bg-amber-100 text-amber-800'
  if (roleKey === 'hr') return 'bg-emerald-100 text-emerald-800'
  if (roleKey === 'manager') return 'bg-sky-100 text-sky-800'
  return 'bg-indigo-100 text-indigo-800'
}
