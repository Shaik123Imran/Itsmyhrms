export const ROLE_KEYS = {
  admin: 'admin',
  hr: 'hr',
  manager: 'manager',
  employee: 'employee',
  finance: 'finance',
  sales: 'sales',
  client: 'client',
  'Super Admin': 'admin',
  SUPER_ADMIN: 'admin',
  SuperAdmin: 'admin',
  'Super admin': 'admin',
  Admin: 'admin',
  Administrator: 'admin',
  CEO: 'admin',
  HR: 'hr',
  'HR Head': 'hr',
  'HR Manager': 'hr',
  HR_HEAD: 'hr',
  Manager: 'manager',
  MANAGER: 'manager',
  'Project Manager': 'manager',
  'Team Lead': 'manager',
  Lead: 'manager',
  PM: 'manager',
  PROJECT_MANAGER: 'manager',
  Employee: 'employee',
  Staff: 'employee',
  EMPLOYEE: 'employee',
  Finance: 'finance',
  'Finance Manager': 'finance',
  'Finance Head': 'finance',
  Accountant: 'finance',
  FINANCE: 'finance',
  Sales: 'sales',
  Marketing: 'sales',
  'Sales & Marketing': 'sales',
  'Sales and Marketing': 'sales',
  'Sales/marketing': 'sales',
  'Sales Manager': 'sales',
  'Marketing Manager': 'sales',
  SALES: 'sales',
  SALES_MARKETING: 'sales',
  Client: 'client',
  'Client Admin': 'client',
  Customer: 'client',
  CLIENT: 'client',
}

export const ROLE_LABELS = {
  admin: 'Super Admin',
  hr: 'HR',
  manager: 'Manager',
  employee: 'Employee',
  finance: 'Finance',
  sales: 'Sales & Marketing',
  client: 'Client',
}

export const ROLE_SUBTITLES = {
  admin: 'Organization command center',
  hr: 'People operations dashboard',
  manager: 'Team management dashboard',
  employee: 'My workday dashboard',
  finance: 'Finance and operations dashboard',
  sales: 'Sales and marketing dashboard',
  client: 'Client delivery dashboard',
}

export const ORG_WIDE_ROLE_KEYS = ['admin', 'hr', 'finance', 'sales', 'client']

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

export function isOrgWideRole(role) {
  return ORG_WIDE_ROLE_KEYS.includes(getRoleKey(role))
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
  if (roleKey === 'finance') return 'bg-teal-100 text-teal-800'
  if (roleKey === 'sales') return 'bg-fuchsia-100 text-fuchsia-800'
  if (roleKey === 'client') return 'bg-orange-100 text-orange-800'
  return 'bg-indigo-100 text-indigo-800'
}
