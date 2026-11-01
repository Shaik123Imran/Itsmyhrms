import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import Modal from '../components/Modal'
import {
  Avatar,
  EmptyState,
  InlineNotice,
  KpiCard,
  ProgressBar,
  StatusBadge,
} from '../components/dashboard/ui'
import { useWorkspaceCollection } from '../hooks/useWorkspaceCollection'
import { STORAGE_KEYS } from '../services/workspaceStore'
import { formatDate, toISODate } from '../utils/date'

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer']
const STAGE_TONES = {
  Applied: 'slate',
  Screening: 'sky',
  Interview: 'indigo',
  Offer: 'emerald',
}

const EMPTY_JOB_FORM = {
  title: '',
  department: 'Engineering',
  location: 'Remote',
  status: 'Open',
}

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function Recruitment() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [positions, setPositions] = useWorkspaceCollection(
    STORAGE_KEYS.positions,
  )
  const [candidates, setCandidates] = useWorkspaceCollection(
    STORAGE_KEYS.candidates,
  )
  const [departments] = useWorkspaceCollection(STORAGE_KEYS.departments)
  const [stageFilter, setStageFilter] = useState(
    searchParams.get('stage') ?? 'All',
  )
  const [search, setSearch] = useState('')
  const [isPostOpen, setIsPostOpen] = useState(false)
  const [pipelineId, setPipelineId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [scheduleId, setScheduleId] = useState(null)
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM)
  const [scheduleForm, setScheduleForm] = useState({
    date: toISODate(),
    time: '10:00',
  })
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setJobForm(EMPTY_JOB_FORM)
      setIsPostOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }

    const candidateId = searchParams.get('candidate')
    if (candidateId) {
      setDetailId(candidateId)
    }
  }, [searchParams, setSearchParams])

  const closePost = () => {
    setIsPostOpen(false)
    setJobForm(EMPTY_JOB_FORM)
  }

  const closeDetail = () => {
    setDetailId(null)
    const next = new URLSearchParams(searchParams)
    next.delete('candidate')
    setSearchParams(next, { replace: true })
  }

  const closeSchedule = () => {
    setScheduleId(null)
    setScheduleForm({ date: toISODate(), time: '10:00' })
  }

  const syncStage = (stage) => {
    const next = new URLSearchParams(searchParams)
    if (stage === 'All') {
      next.delete('stage')
    } else {
      next.set('stage', stage)
    }
    setSearchParams(next, { replace: true })
  }

  const handleJobChange = (event) => {
    const { name, value } = event.target
    setJobForm((current) => ({ ...current, [name]: value }))
  }

  const handlePostJob = (event) => {
    event.preventDefault()
    const title = jobForm.title.trim()
    const location = jobForm.location.trim()

    if (!title || !location) {
      setNotice({
        tone: 'error',
        message: 'Job title and location are required.',
      })
      return
    }

    setPositions((current) => [
      {
        id: `JOB-${Date.now()}`,
        title,
        department: jobForm.department,
        location,
        applicants: 0,
        status: jobForm.status,
      },
      ...current,
    ])
    setNotice({ tone: 'success', message: `${title} was posted.` })
    closePost()
  }

  const handleSchedule = (event) => {
    event.preventDefault()
    const candidate = candidates.find((item) => item.id === scheduleId)
    if (!candidate) return

    setCandidates((current) =>
      current.map((item) =>
        item.id === scheduleId
          ? {
              ...item,
              stage: 'Interview',
              interviewDate: scheduleForm.date,
              interviewTime: scheduleForm.time,
            }
          : item,
      ),
    )
    setNotice({
      tone: 'success',
      message: `Interview scheduled for ${candidate.name} on ${formatDate(
        scheduleForm.date,
      )} at ${scheduleForm.time}.`,
    })
    closeSchedule()
  }

  const stageCounts = useMemo(
    () =>
      STAGES.reduce((counts, stage) => {
        counts[stage] = candidates.filter(
          (candidate) => candidate.stage === stage,
        ).length
        return counts
      }, {}),
    [candidates],
  )

  const activeCandidates = candidates.filter(
    (candidate) => candidate.stage !== 'Rejected',
  )
  const openPositions = positions.filter(
    (position) => position.status !== 'Closed',
  )
  const todayISO = toISODate()
  const upcomingInterviews = candidates.filter(
    (candidate) =>
      candidate.stage === 'Interview' &&
      candidate.interviewDate &&
      candidate.interviewDate >= todayISO,
  )
  const offers = candidates.filter((candidate) => candidate.stage === 'Offer')

  const filteredCandidates = candidates
    .filter(
      (candidate) =>
        stageFilter === 'All' || candidate.stage === stageFilter,
    )
    .filter((candidate) => {
      const query = search.trim().toLowerCase()
      return (
        !query ||
        [candidate.name, candidate.role, candidate.email, candidate.source]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
    })

  const pipelinePosition = positions.find(
    (position) => position.id === pipelineId,
  )
  const pipelineCandidates = pipelinePosition
    ? candidates.filter(
        (candidate) => candidate.role === pipelinePosition.title,
      )
    : []

  const detailCandidate = candidates.find(
    (candidate) => candidate.id === detailId,
  )
  const scheduleCandidate = candidates.find(
    (candidate) => candidate.id === scheduleId,
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Briefcase className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Recruitment
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage open roles and move candidates through the pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setJobForm(EMPTY_JOB_FORM)
            setIsPostOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Post a job
        </button>
      </div>

      {notice ? (
        <InlineNotice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.message}
        </InlineNotice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open positions"
          value={openPositions.length}
          detail="Accepting applications"
          icon={Briefcase}
          accent="indigo"
        />
        <KpiCard
          label="Active candidates"
          value={activeCandidates.length}
          detail="In the hiring pipeline"
          icon={Users}
          accent="sky"
        />
        <KpiCard
          label="Upcoming interviews"
          value={upcomingInterviews.length}
          detail="Scheduled from today"
          icon={CalendarDays}
          accent="emerald"
        />
        <KpiCard
          label="Offers out"
          value={offers.length}
          detail="Awaiting candidate response"
          icon={CheckCircle2}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Open positions
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Roles currently accepting applications
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {openPositions.length} roles
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {openPositions.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Briefcase}
                  title="No open positions"
                  description="Post a job to start building your hiring pipeline."
                  action={
                    <button
                      type="button"
                      onClick={() => setIsPostOpen(true)}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Post a job
                    </button>
                  }
                />
              </div>
            ) : (
              openPositions.map((position) => {
                const applicantCount = candidates.filter(
                  (candidate) => candidate.role === position.title,
                ).length
                const totalApplicants = Math.max(
                  applicantCount,
                  Number(position.applicants || 0),
                )

                return (
                  <div
                    key={position.id ?? position.title}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {position.title}
                        </h3>
                        <StatusBadge status={position.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{position.department}</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {position.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {totalApplicants} applicants
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPipelineId(position.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white hover:text-indigo-700 sm:self-auto"
                    >
                      View pipeline
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Hiring pipeline
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {activeCandidates.length} candidates in progress
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {STAGES.map((stage) => {
              const count = stageCounts[stage] ?? 0
              const width =
                activeCandidates.length > 0
                  ? Math.round((count / activeCandidates.length) * 100)
                  : 0
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {stage}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {count}
                    </span>
                  </div>
                  <ProgressBar
                    value={width}
                    tone={STAGE_TONES[stage]}
                    className="mt-1.5"
                  />
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setStageFilter('All')
              syncStage('All')
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            View all candidates
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Candidates
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredCandidates.length} of {candidates.length} candidates
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidates"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-52"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {['All', ...STAGES].map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => {
                    setStageFilter(stage)
                    syncStage(stage)
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                    stageFilter === stage
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Candidate</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Stage</th>
                <th className="px-3 py-3 font-semibold">Applied</th>
                <th className="px-3 py-3 font-semibold">Interview</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No candidates found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try another stage or search term.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={candidate.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {candidate.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {candidate.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-600">
                      {candidate.role}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <StatusBadge status={candidate.stage} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-600">
                      {formatDate(candidate.appliedDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-600">
                      {candidate.interviewDate ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(candidate.interviewDate)} ·{' '}
                          {candidate.interviewTime}
                        </span>
                      ) : (
                        'Not scheduled'
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(candidate.id)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>
                        {candidate.stage !== 'Offer' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleId(candidate.id)
                              setScheduleForm({
                                date: candidate.interviewDate ?? toISODate(),
                                time: candidate.interviewTime ?? '10:00',
                              })
                            }}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            {candidate.interviewDate
                              ? 'Reschedule'
                              : 'Schedule'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={isPostOpen}
        onClose={closePost}
        title="Post a job"
        description="Publish a new opening to the recruitment pipeline."
      >
        <form className="space-y-4" onSubmit={handlePostJob}>
          <div>
            <label
              htmlFor="job-title"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Job title
            </label>
            <input
              id="job-title"
              name="title"
              type="text"
              required
              value={jobForm.title}
              onChange={handleJobChange}
              placeholder="e.g. Backend Engineer"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="job-department"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Department
            </label>
            <select
              id="job-department"
              name="department"
              value={jobForm.department}
              onChange={handleJobChange}
              className={FIELD_CLASS}
            >
              {departments.length > 0 ? (
                departments.map((department) => (
                  <option key={department.id ?? department.name}>
                    {department.name}
                  </option>
                ))
              ) : (
                <>
                  <option>Engineering</option>
                  <option>Human Resources</option>
                  <option>Delivery</option>
                  <option>Sales</option>
                  <option>Finance</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="job-location"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Location
            </label>
            <input
              id="job-location"
              name="location"
              type="text"
              required
              value={jobForm.location}
              onChange={handleJobChange}
              placeholder="e.g. Remote"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="job-status"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Priority
            </label>
            <select
              id="job-status"
              name="status"
              value={jobForm.status}
              onChange={handleJobChange}
              className={FIELD_CLASS}
            >
              <option>Open</option>
              <option>Urgent</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={closePost}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Post job
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(pipelinePosition)}
        onClose={() => setPipelineId(null)}
        title={
          pipelinePosition
            ? `${pipelinePosition.title} pipeline`
            : 'Hiring pipeline'
        }
        description={
          pipelinePosition
            ? `${pipelineCandidates.length} tracked candidates · ${pipelinePosition.department} · ${pipelinePosition.location}`
            : 'Candidates moving through the hiring stages.'
        }
      >
        <div className="space-y-4">
          {STAGES.map((stage) => {
            const count = pipelineCandidates.filter(
              (candidate) => candidate.stage === stage,
            ).length
            const width =
              pipelineCandidates.length > 0
                ? Math.round((count / pipelineCandidates.length) * 100)
                : 0
            return (
              <div key={stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{stage}</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {count}
                  </span>
                </div>
                <ProgressBar
                  value={width}
                  tone={STAGE_TONES[stage]}
                  className="mt-1.5"
                />
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setPipelineId(null)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              setPipelineId(null)
              setStageFilter('All')
              syncStage('All')
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            View candidates
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(detailCandidate)}
        onClose={closeDetail}
        title="Candidate profile"
        description="Application, interview, and sourcing details."
      >
        {detailCandidate ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={detailCandidate.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">
                  {detailCandidate.name}
                </p>
                <p className="text-xs text-slate-500">
                  {detailCandidate.email}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={detailCandidate.stage} />
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Role', detailCandidate.role],
                ['Source', detailCandidate.source ?? '—'],
                ['Applied', formatDate(detailCandidate.appliedDate)],
                [
                  'Interview',
                  detailCandidate.interviewDate
                    ? `${formatDate(detailCandidate.interviewDate)} · ${detailCandidate.interviewTime}`
                    : 'Not scheduled',
                ],
                ['Interviewer', detailCandidate.interviewer ?? '—'],
                ['Offer status', detailCandidate.offerStatus ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              {detailCandidate.stage !== 'Offer' ? (
                <button
                  type="button"
                  onClick={() => {
                    setDetailId(null)
                    setScheduleId(detailCandidate.id)
                    setScheduleForm({
                      date: detailCandidate.interviewDate ?? toISODate(),
                      time: detailCandidate.interviewTime ?? '10:00',
                    })
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Schedule interview
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(scheduleCandidate)}
        onClose={closeSchedule}
        title="Schedule interview"
        description={
          scheduleCandidate
            ? `Pick a slot for ${scheduleCandidate.name}.`
            : 'Pick an interview slot.'
        }
      >
        <form className="space-y-4" onSubmit={handleSchedule}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="interview-date"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Date
              </label>
              <input
                id="interview-date"
                type="date"
                required
                value={scheduleForm.date}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="interview-time"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Time
              </label>
              <input
                id="interview-time"
                type="time"
                required
                value={scheduleForm.time}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={closeSchedule}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
