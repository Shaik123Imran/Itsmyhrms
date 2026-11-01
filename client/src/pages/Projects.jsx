import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import Modal from '../components/Modal'
import {
  EmptyState,
  InlineNotice,
  KpiCard,
  ProgressBar,
  StatusBadge,
} from '../components/dashboard/ui'
import { useAuth } from '../contexts/AuthContext'
import { getRoleKey } from '../config/roles'
import { useWorkspaceCollection } from '../hooks/useWorkspaceCollection'
import {
  STORAGE_KEYS,
  getCurrentEmployee,
  getInitials,
  getTeamMembers,
} from '../services/workspaceStore'
import { formatDate } from '../utils/date'

const STATUS_OPTIONS = ['All', 'On Track', 'At Risk', 'Completed']

const PROGRESS_TONES = {
  'On Track': 'emerald',
  'At Risk': 'amber',
  Completed: 'slate',
}

const EMPTY_FORM = {
  name: '',
  client: '',
  dueDate: '',
  status: 'On Track',
}

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function Projects() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useWorkspaceCollection(
    STORAGE_KEYS.projects,
  )
  const [employees] = useWorkspaceCollection(STORAGE_KEYS.employees)
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') ?? 'All',
  )
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [notice, setNotice] = useState(null)

  const roleKey = getRoleKey(user?.role)
  const isOrgRole = roleKey === 'admin' || roleKey === 'hr'
  const isManager = roleKey === 'manager'
  const currentEmployee = getCurrentEmployee(user, employees)
  const teamMembers = useMemo(
    () =>
      isManager
        ? getTeamMembers(currentEmployee?.id, employees)
        : [],
    [isManager, currentEmployee, employees],
  )

  const visibleProjects = useMemo(() => {
    if (isOrgRole) return projects
    if (isManager) {
      const initials = new Set(
        [currentEmployee, ...teamMembers]
          .filter(Boolean)
          .map((employee) => getInitials(employee.name)),
      )
      return projects.filter((project) =>
        (project.team ?? []).some((member) => initials.has(member)),
      )
    }
    return currentEmployee
      ? projects.filter((project) =>
          (project.team ?? []).includes(getInitials(currentEmployee.name)),
        )
      : []
  }, [projects, isOrgRole, isManager, currentEmployee, teamMembers])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setForm(EMPTY_FORM)
      setIsModalOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const closeModal = () => {
    setIsModalOpen(false)
    setForm(EMPTY_FORM)
  }

  const syncFilter = (value) => {
    const next = new URLSearchParams(searchParams)
    if (value === 'All') {
      next.delete('status')
    } else {
      next.set('status', value)
    }
    setSearchParams(next, { replace: true })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const client = form.client.trim()

    if (!name || !client || !form.dueDate) {
      setNotice({
        tone: 'error',
        message: 'Project name, client, and due date are required.',
      })
      return
    }

    setProjects((current) => [
      {
        name,
        client,
        status: form.status,
        progress: 0,
        dueDate: formatDate(form.dueDate),
        team: [getInitials(user?.name || 'New User')],
      },
      ...current,
    ])
    setNotice({ tone: 'success', message: `${name} was created.` })
    closeModal()
  }

  const filteredProjects = visibleProjects
    .filter(
      (project) =>
        statusFilter === 'All' || project.status === statusFilter,
    )
    .filter((project) => {
      const query = search.trim().toLowerCase()
      return (
        !query ||
        [project.name, project.client]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
    })

  const activeProjects = visibleProjects.filter(
    (project) => project.status !== 'Completed',
  ).length
  const onTrack = visibleProjects.filter(
    (project) => project.status === 'On Track',
  ).length
  const atRisk = visibleProjects.filter(
    (project) => project.status === 'At Risk',
  ).length
  const completed = visibleProjects.filter(
    (project) => project.status === 'Completed',
  ).length

  const scopeLabel = isOrgRole
    ? 'Organisation portfolio'
    : isManager
      ? 'Your team portfolio'
      : 'Your projects'

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FolderKanban className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Projects
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {scopeLabel} · delivery health and progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      {notice ? (
        <InlineNotice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.message}
        </InlineNotice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active projects"
          value={activeProjects}
          detail={`${new Set(visibleProjects.map((project) => project.client)).size} clients`}
          icon={FolderKanban}
          accent="indigo"
        />
        <KpiCard
          label="On track"
          value={onTrack}
          detail="Healthy delivery"
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          label="At risk"
          value={atRisk}
          detail="Needs attention"
          icon={AlertTriangle}
          accent="amber"
        />
        <KpiCard
          label="Completed"
          value={completed}
          detail="Delivered projects"
          icon={CheckCircle2}
          accent="slate"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Project portfolio
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredProjects.length} of {visibleProjects.length} projects
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects or clients"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status)
                    syncFilter(status)
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects found"
              description="Try a different status or search, or create a new project."
              action={
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Create project
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <div
                  key={`${project.name}-${project.client}`}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {project.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {project.client}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        Progress
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {project.progress}%
                      </span>
                    </div>
                    <ProgressBar
                      value={project.progress}
                      tone={
                        PROGRESS_TONES[project.status] ?? 'indigo'
                      }
                      className="mt-1.5"
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {project.dueDate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <div className="flex -space-x-2">
                        {(project.team ?? []).map((member) => (
                          <span
                            key={member}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-bold text-indigo-700"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="New project"
        description="Create a project and start tracking delivery."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="project-name"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Project name
            </label>
            <input
              id="project-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Analytics Dashboard"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="project-client"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Client
            </label>
            <input
              id="project-client"
              name="client"
              type="text"
              required
              value={form.client}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              className={FIELD_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="project-due-date"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Due date
              </label>
              <input
                id="project-due-date"
                name="dueDate"
                type="date"
                required
                value={form.dueDate}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="project-status"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Status
              </label>
              <select
                id="project-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option>On Track</option>
                <option>At Risk</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Create project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
