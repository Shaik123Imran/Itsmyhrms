import { Megaphone, Pin } from 'lucide-react'
import { relativeTime } from '../../utils/date'
import { EmptyState, SectionAction, SectionCard } from './ui'

const CATEGORY_TONES = {
  Company: 'bg-indigo-50 text-indigo-700',
  Policy: 'bg-amber-50 text-amber-700',
  Benefits: 'bg-emerald-50 text-emerald-700',
  People: 'bg-sky-50 text-sky-700',
}

export function AnnouncementsCard({
  items = [],
  onViewAll,
  limit = 3,
  title = 'Announcements',
  description = 'Company updates and people news',
  className,
}) {
  const visible = items.slice(0, limit)

  return (
    <SectionCard
      id="announcements"
      title={title}
      description={description}
      icon={Megaphone}
      className={className}
      bodyClassName="p-0"
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>View all</SectionAction>
        ) : null
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={Megaphone}
            title="No announcements"
            description="Company updates will appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((announcement) => (
            <li key={announcement.id} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.pinned ? (
                      <Pin className="h-3.5 w-3.5 text-indigo-500" />
                    ) : null}
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {announcement.title}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {announcement.body}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        CATEGORY_TONES[announcement.category] ??
                        'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {announcement.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {announcement.author} ·{' '}
                      {relativeTime(announcement.publishedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
