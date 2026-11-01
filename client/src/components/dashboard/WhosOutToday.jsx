import { CalendarX, Plane, Wifi } from 'lucide-react'
import { Avatar, EmptyState, SectionAction, SectionCard, StatusBadge } from './ui'

export function WhosOutToday({
  items = [],
  onViewAll,
  title = "Who's out today",
  description = 'Leave and remote availability across your scope',
  className,
}) {
  return (
    <SectionCard
      id="whos-out"
      title={title}
      description={description}
      icon={CalendarX}
      className={className}
      bodyClassName="p-0"
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>Attendance</SectionAction>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={CalendarX}
            title="Everyone is in today"
            description="No one is on leave or working remotely in your scope."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((person) => {
            const isRemote = person.status === 'Remote'
            return (
              <li key={person.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="relative">
                  <Avatar name={person.name} initials={person.initials} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                      isRemote ? 'bg-sky-500' : 'bg-violet-500'
                    }`}
                  >
                    {isRemote ? (
                      <Wifi className="h-2 w-2 text-white" />
                    ) : (
                      <Plane className="h-2 w-2 text-white" />
                    )}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {person.name}
                    </p>
                    <StatusBadge status={person.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {person.detail}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {person.availability}
                  </p>
                </div>

                <span className="hidden shrink-0 text-right text-[11px] font-medium text-slate-400 sm:block">
                  {person.department}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
