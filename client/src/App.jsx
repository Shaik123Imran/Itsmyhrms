import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ROUTE_ACCESS } from './config/navigation'
import { getRoleKey } from './config/roles'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import Attendance from './pages/Attendance'
import CRM from './pages/CRM'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Leave from './pages/Leave'
import Login from './pages/Login'
import Projects from './pages/Projects'
import Recruitment from './pages/Recruitment'
import Reports from './pages/Reports'
import Timesheets from './pages/Timesheets'

function ProtectedRoute() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function RoleRoute({ module, children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const allowedRoles = ROUTE_ACCESS[module] ?? []

  if (!allowedRoles.includes(getRoleKey(user.role))) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route
                path="attendance"
                element={
                  <RoleRoute module="attendance">
                    <Attendance />
                  </RoleRoute>
                }
              />
              <Route
                path="leave"
                element={
                  <RoleRoute module="leave">
                    <Leave />
                  </RoleRoute>
                }
              />
              <Route
                path="timesheets"
                element={
                  <RoleRoute module="timesheets">
                    <Timesheets />
                  </RoleRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <RoleRoute module="employees">
                    <Employees />
                  </RoleRoute>
                }
              />
              <Route
                path="recruitment"
                element={
                  <RoleRoute module="recruitment">
                    <Recruitment />
                  </RoleRoute>
                }
              />
              <Route
                path="projects"
                element={
                  <RoleRoute module="projects">
                    <Projects />
                  </RoleRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <RoleRoute module="reports">
                    <Reports />
                  </RoleRoute>
                }
              />
              <Route
                path="crm"
                element={
                  <RoleRoute module="crm">
                    <CRM />
                  </RoleRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
