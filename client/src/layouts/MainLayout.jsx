import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { Building2, Menu, X } from 'lucide-react'
import { getNavigationForRole } from '../config/navigation'
import { roleBadgeClass } from '../config/roles'
import { useAuth } from '../contexts/AuthContext'
import { NotificationMenu } from '../components/layout/NotificationMenu'
import { ProfileMenu } from '../components/layout/ProfileMenu'

export default function MainLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const links = getNavigationForRole(user?.role)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              ITSHRMS
            </span>
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:inline">
              Workspace
            </span>
          </NavLink>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationMenu />
          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
          <ProfileMenu />
        </div>
      </header>

      <div className="flex">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-16 z-30 bg-slate-900/40 md:hidden"
          />
        ) : null}

        <aside
          className={clsx(
            'fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:sticky md:h-[calc(100vh-4rem)] md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-full flex-col">
            <nav
              aria-label="Primary"
              className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
            >
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Workspace
              </p>
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-indigo-600" />
                        ) : null}
                        <Icon
                          className={clsx(
                            'h-5 w-5 shrink-0',
                            isActive
                              ? 'text-indigo-600'
                              : 'text-slate-400 group-hover:text-slate-600',
                          )}
                        />
                        <span className="truncate">{link.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Signed in as
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                  {user?.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {user?.email}
                </p>
                <span
                  className={clsx(
                    'mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    roleBadgeClass(user?.role),
                  )}
                >
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
