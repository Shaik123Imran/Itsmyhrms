import { CalendarClock } from 'lucide-react'
import { formatDate, relativeLabel } from '../../utils/date'
import {
  Avatar,
  EmptyState,
  SectionAction,
  SectionCard,
} from './ui'

export function InterviewsCard({
  interviews = [],
  onViewAll,
  limit = 4,
  title = 'Upcoming interviews',
  description = 'Scheduled conversations with candidates',
  className,
}) {
  const visible = interviews.slice(0, limit)

  return (
    <SectionCard
      id="interviews"
      title={title}
      description={description}
      icon={CalendarClock}
      className={className}
      bodyClassName="p-0"
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>Recruitment</SectionAction>
        ) : null
      }
    >
      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            compact
            icon={CalendarClock}
            title="No interviews scheduled"
            description="Candidate interviews will appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((interview) => (
            <li
              key={interview.id}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <Avatar name={interview.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {interview.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {interview.role} · {interview.interviewer}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  {relativeLabel(interview.interviewDate)} ·{' '}
                  {formatDate(interview.interviewDate, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at {interview.interviewTime}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
