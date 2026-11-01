import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'
import { EmptyState } from './ui'

const COLORS = {
  present: '#10b981',
  remote: '#0ea5e9',
  late: '#f59e0b',
  onLeave: '#8b5cf6',
  absent: '#f43f5e',
  indigo: '#6366f1',
  slate: '#94a3b8',
}

const AXIS_TICK = { fontSize: 11, fill: '#64748b' }
const GRID_STROKE = '#e2e8f0'

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label ? (
        <p className="mb-1 font-semibold text-slate-700">{label}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={`${entry.dataKey}-${entry.name}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-slate-800">
              {entry.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function hasValues(data, keys) {
  if (!Array.isArray(data) || data.length === 0) {
    return false
  }
  return data.some((row) =>
    keys.some((key) => Number(row?.[key]) > 0),
  )
}

function ChartEmpty({ title, description, icon = BarChart3 }) {
  return (
    <EmptyState
      compact
      icon={icon}
      title={title}
      description={description}
    />
  )
}

export function AttendanceTrendChart({ data, height = 280 }) {
  const keys = ['present', 'remote', 'late', 'onLeave']
  const ready = hasValues(data, keys)

  if (!ready) {
    return (
      <ChartEmpty
        icon={TrendingUp}
        title="No attendance activity yet"
        description="Attendance trends will appear once your team starts marking attendance."
      />
    )
  }

  return (
    <div
      role="img"
      aria-label="Stacked attendance trend for the selected period"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.present} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.present} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="remoteFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.remote} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.remote} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="lateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.late} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.late} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="present"
            name="Present"
            stackId="attendance"
            stroke={COLORS.present}
            strokeWidth={2}
            fill="url(#presentFill)"
          />
          <Area
            type="monotone"
            dataKey="remote"
            name="Remote"
            stackId="attendance"
            stroke={COLORS.remote}
            strokeWidth={2}
            fill="url(#remoteFill)"
          />
          <Area
            type="monotone"
            dataKey="late"
            name="Late"
            stackId="attendance"
            stroke={COLORS.late}
            strokeWidth={2}
            fill="url(#lateFill)"
          />
          <Line
            type="monotone"
            dataKey="onLeave"
            name="On leave"
            stroke={COLORS.onLeave}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DepartmentPieChart({ data, height = 240 }) {
  const total = (data ?? []).reduce((sum, item) => sum + item.value, 0)

  if (!data?.length || total === 0) {
    return (
      <ChartEmpty
        icon={PieIcon}
        title="No people to chart"
        description="Department distribution appears when employees are assigned."
      />
    )
  }

  return (
    <div
      role="img"
      aria-label="Department distribution pie chart"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RecruitmentFunnelChart({ data, height = 220 }) {
  const total = (data ?? []).reduce((sum, item) => sum + item.count, 0)

  if (!data?.length || total === 0) {
    return (
      <ChartEmpty
        title="No candidates in the pipeline"
        description="Add candidates to see the recruitment funnel."
      />
    )
  }

  return (
    <div
      role="img"
      aria-label="Recruitment funnel by stage"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 28, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="stage"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="count" name="Candidates" fill={COLORS.indigo} radius={[0, 6, 6, 0]} barSize={18}>
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WorkloadBarChart({ data, height = 250 }) {
  const ready = Array.isArray(data) && data.some((item) => item.total > 0)

  if (!ready) {
    return (
      <ChartEmpty
        title="No active tasks"
        description="Workload appears when tasks are assigned to the team."
      />
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    label: item.name?.split(' ')[0] ?? item.initials,
  }))

  return (
    <div
      role="img"
      aria-label="Active workload by team member"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Bar
            dataKey="total"
            name="Active tasks"
            fill={COLORS.indigo}
            radius={[6, 6, 0, 0]}
            barSize={22}
          />
          <Bar
            dataKey="overdue"
            name="Overdue"
            fill={COLORS.absent}
            radius={[6, 6, 0, 0]}
            barSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LeaveTypeBarChart({ data, height = 240 }) {
  const total = (data ?? []).reduce((sum, item) => sum + item.value, 0)

  if (!data?.length || total === 0) {
    return (
      <ChartEmpty
        title="No leave records"
        description="Leave type breakdown appears when requests are submitted."
      />
    )
  }

  return (
    <div
      role="img"
      aria-label="Leave requests by type"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="name"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval={0}
            height={44}
          />
          <YAxis
            allowDecimals={false}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" name="Requests" fill={COLORS.indigo} radius={[6, 6, 0, 0]} barSize={26}>
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  [COLORS.indigo, COLORS.remote, COLORS.present, COLORS.late, COLORS.onLeave][
                    index % 5
                  ]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HoursBarChart({ data, height = 230 }) {
  const ready = Array.isArray(data) && data.some((item) => item.hours > 0)

  if (!ready) {
    return (
      <ChartEmpty
        title="No hours logged"
        description="Logged hours will appear once timesheets are submitted."
      />
    )
  }

  return (
    <div
      role="img"
      aria-label="Logged hours by day"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip suffix="h" />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="hours" name="Hours" fill={COLORS.remote} radius={[6, 6, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { COLORS as CHART_COLORS }
