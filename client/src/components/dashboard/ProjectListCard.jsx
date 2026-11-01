import { FolderKanban } from 'lucide-react'
import { formatDate } from '../../utils/date'
import {
  EmptyState,
  ProgressBar,
  SectionAction,
  SectionCard,
  StatusBadge,
} from './ui'

const STATUS_TONES = {
  'At Risk': 'rose',
  'On Track': 'emerald',
  Completed: 'slate',
}

export function ProjectListCard({
  projects = [],
  onViewAll,
  limit = 4,
  title = 'Projects',
  description = 'Delivery health across your scope',
  className,
}) {
  const visible = projects.slice(0, limit)

  return (
    <SectionCard
      id="projects"
      title={title}
      description={description}
      icon={FolderKanban}
      className={className}
      bodyClassName="p-0"
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>View projects</SectionAction>
        ) : null
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={FolderKanban}
            title="No projects yet"
            description="Projects will appear here once they are created."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((project) => (
            <li key={project.name} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {project.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {project.client}
                  </p>
                </div>
                <StatusBadge
                  status={project.status}
                  tone={STATUS_TONES[project.status]}
                />
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <ProgressBar
                  value={project.progress}
                  tone={project.status === 'At Risk' ? 'rose' : 'indigo'}
                />
                <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                  {project.progress}%
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex -space-x-1.5">
                  {(project.team ?? []).slice(0, 4).map((initials) => (
                    <span
                      key={initials}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-bold text-slate-600"
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Due {formatDate(project.dueDate, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
