import { useState } from 'react'
import {
  CircleDollarSign,
  Clock,
  Download,
  Filter,
  TrendingUp,
  Users,
} from 'lucide-react'

const REPORT_STATS = [
  {
    label: 'Total Revenue',
    value: '$1.24M',
    detail: '+8.2% vs last month',
    icon: CircleDollarSign,
    accent: 'bg-indigo-50 text-indigo-600',
  },
  {
    label: 'Utilization',
    value: '86%',
    detail: '+3% vs last month',
    icon: TrendingUp,
    accent: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Attrition',
    value: '4.2%',
    detail: '-0.6% vs last quarter',
    icon: Users,
    accent: 'bg-sky-50 text-sky-600',
  },
  {
    label: 'Avg. Time to Hire',
    value: '21 days',
    detail: '3 days faster than target',
    icon: Clock,
    accent: 'bg-amber-50 text-amber-600',
  },
]

const HEADCOUNT_BY_DEPARTMENT = [
  { department: 'Engineering', count: 92, bar: 'bg-indigo-500' },
  { department: 'Delivery', count: 64, bar: 'bg-sky-500' },
  { department: 'Sales', count: 48, bar: 'bg-emerald-500' },
  { department: 'Human Resources', count: 26, bar: 'bg-amber-500' },
  { department: 'Finance', count: 18, bar: 'bg-rose-500' },
]

const REVENUE_TREND = [
  { month: 'May', value: 860 },
  { month: 'Jun', value: 920 },
  { month: 'Jul', value: 880 },
  { month: 'Aug', value: 1010 },
  { month: 'Sep', value: 1150 },
  { month: 'Oct', value: 1240 },
]

const RECENT_REPORTS = [
  {
    name: 'Monthly Headcount Summary',
    period: 'October 2026',
    generated: 'Oct 29, 2026',
    format: 'PDF',
  },
  {
    name: 'Revenue & Billing Report',
    period: 'Q3 2026',
    generated: 'Oct 25, 2026',
    format: 'CSV',
  },
  {
    name: 'Attendance Compliance',
    period: 'September 2026',
    generated: 'Oct 12, 2026',
    format: 'PDF',
  },
  {
    name: 'Recruitment Funnel',
    period: 'September 2026',
    generated: 'Oct 05, 2026',
    format: 'CSV',
  },
  {
    name: 'Annual Compliance Audit',
    period: 'FY 2025-26',
    generated: 'Jul 15, 2026',
    format: 'PDF',
  },
]

const FORMAT_STYLES = {
  PDF: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  CSV: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

const RANGE_DAYS = {
  'Last 30 days': 30,
  'Last 90 days': 90,
  'All time': null,
}

const REPORT_REFERENCE_TIME = Date.now()
const REPORTS_WITH_TIMESTAMPS = RECENT_REPORTS.map((report) => ({
  ...report,
  generatedAt: Date.parse(report.generated),
}))

function downloadCsv(reports, filename) {
  const rows = [
    ['Report', 'Period', 'Generated', 'Format'],
    ...reports.map((report) => [
      report.name,
      report.period,
      report.generated,
      report.format,
    ]),
  ]

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function toFileName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function Reports() {
  const [range, setRange] = useState('Last 30 days')

  const maxHeadcount = Math.max(
    ...HEADCOUNT_BY_DEPARTMENT.map((item) => item.count),
  )
  const maxRevenue = Math.max(...REVENUE_TREND.map((item) => item.value))

  const days = RANGE_DAYS[range]
  const filteredReports = days
    ? REPORTS_WITH_TIMESTAMPS.filter(
        (report) =>
          report.generatedAt >= REPORT_REFERENCE_TIME - days * 86400000,
      )
    : REPORTS_WITH_TIMESTAMPS

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Company performance, workforce, and hiring insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              aria-label="Report date range"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>All time</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(filteredReports, 'itshrms-reports.csv')
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {stat.detail}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Headcount by Department
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              248 employees across 5 departments
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {HEADCOUNT_BY_DEPARTMENT.map((item) => (
              <div key={item.department}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    {item.department}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {item.count}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.bar}`}
                    style={{ width: `${(item.count / maxHeadcount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Monthly Revenue
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Revenue in thousands (USD)
            </p>
          </div>

          <div className="mt-5 flex items-end gap-3">
            {REVENUE_TREND.map((item) => (
              <div
                key={item.month}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-[10px] font-medium tabular-nums text-slate-500">
                  {item.value}
                </span>
                <div className="flex h-40 w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400"
                    style={{
                      height: `${(item.value / maxRevenue) * 100}%`,
                    }}
                    title={`${item.month}: $${item.value}K`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Reports
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Your most recently generated exports
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {filteredReports.length} reports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Report</th>
                <th className="px-5 py-3 font-semibold">Period</th>
                <th className="px-5 py-3 font-semibold">Generated</th>
                <th className="px-5 py-3 font-semibold">Format</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No reports found for this range.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.name}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                      {report.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {report.period}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {report.generated}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          FORMAT_STYLES[report.format]
                        }`}
                      >
                        {report.format}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          downloadCsv(
                            [report],
                            `${toFileName(report.name)}.csv`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
