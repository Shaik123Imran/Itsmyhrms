import { Wallet } from 'lucide-react'
import { EmptyState, ProgressBar, SectionAction, SectionCard } from './ui'

const TONES = ['indigo', 'emerald', 'amber', 'sky']

export function LeaveBalancesCard({
  balances = [],
  onViewAll,
  title = 'Leave balance',
  description = 'Available days by leave type',
  className,
}) {
  return (
    <SectionCard
      id="leave-balance"
      title={title}
      description={description}
      icon={Wallet}
      className={className}
      action={
        onViewAll ? (
          <SectionAction onClick={onViewAll}>Apply leave</SectionAction>
        ) : null
      }
    >
      {balances.length === 0 ? (
        <EmptyState
          compact
          icon={Wallet}
          title="No leave balance"
          description="Your leave balance will appear once it is assigned."
        />
      ) : (
        <div className="space-y-4">
          {balances.map((balance, index) => {
            const percentage = balance.total
              ? Math.round((balance.available / balance.total) * 100)
              : 0
            return (
              <div key={balance.type}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {balance.type}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    <span className="font-bold text-slate-800">
                      {balance.available}
                    </span>{' '}
                    / {balance.total} days
                  </span>
                </div>
                <ProgressBar
                  value={percentage}
                  tone={TONES[index % TONES.length]}
                />
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
