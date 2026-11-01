import { useState } from 'react'
import {
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  Handshake,
  Plus,
  Target,
} from 'lucide-react'
import Modal from '../components/Modal'
import { usePersistentState } from '../hooks/usePersistentState'

const CRM_STATS = [
  {
    label: 'Active Clients',
    value: '36',
    detail: '4 onboarding this month',
    icon: Handshake,
    accent: 'bg-indigo-50 text-indigo-600',
  },
  {
    label: 'Pipeline Value',
    value: '$2.4M',
    detail: '54 open deals',
    icon: CircleDollarSign,
    accent: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Win Rate',
    value: '28%',
    detail: '+3% this quarter',
    icon: Target,
    accent: 'bg-sky-50 text-sky-600',
  },
]

const PIPELINE_STAGES = [
  {
    stage: 'Lead',
    deals: 24,
    value: '$680K',
    accent: 'border-slate-400',
    badge: 'bg-slate-100 text-slate-600',
  },
  {
    stage: 'Qualified',
    deals: 16,
    value: '$420K',
    accent: 'border-sky-500',
    badge: 'bg-sky-50 text-sky-700',
  },
  {
    stage: 'Proposal',
    deals: 9,
    value: '$310K',
    accent: 'border-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700',
  },
  {
    stage: 'Negotiation',
    deals: 5,
    value: '$190K',
    accent: 'border-amber-500',
    badge: 'bg-amber-50 text-amber-700',
  },
]

const INITIAL_CLIENTS = [
  {
    name: 'Northwind Traders',
    industry: 'Retail',
    owner: 'Priya Sharma',
    value: '$240,000',
    status: 'Active',
  },
  {
    name: 'Acme Corp',
    industry: 'Manufacturing',
    owner: 'Rohan Verma',
    value: '$180,000',
    status: 'Active',
  },
  {
    name: 'Globex',
    industry: 'Technology',
    owner: 'Arjun Nair',
    value: '$95,000',
    status: 'Prospect',
  },
  {
    name: 'Initech',
    industry: 'Finance',
    owner: 'Meera Iyer',
    value: '$320,000',
    status: 'Active',
  },
  {
    name: 'Umbrella Group',
    industry: 'Healthcare',
    owner: 'Neha Kapoor',
    value: '$60,000',
    status: 'At Risk',
  },
]

const STATUS_STYLES = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Prospect: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'At Risk': 'bg-red-50 text-red-700 ring-red-600/20',
}

const EMPTY_FORM = {
  name: '',
  industry: '',
  owner: '',
  value: '',
  status: 'Active',
}

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function CRM() {
  const [clients, setClients] = usePersistentState(
    'itshrms.clients',
    INITIAL_CLIENTS,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeClientName, setActiveClientName] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const activeClient = clients.find(
    (client) => client.name === activeClientName,
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const industry = form.industry.trim()
    const owner = form.owner.trim()
    const numericValue = Number.parseFloat(form.value)

    if (
      !name ||
      !industry ||
      !owner ||
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      return
    }

    setClients((current) => [
      {
        name,
        industry,
        owner,
        value: `$${numericValue.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}`,
        status: form.status,
      },
      ...current,
    ])
    setForm(EMPTY_FORM)
    setIsModalOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            CRM
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage client relationships and your sales pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CRM_STATS.map((stat) => {
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
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.accent}`}
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

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Sales Pipeline
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.stage}
              className={`rounded-2xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm ${stage.accent}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stage.stage}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stage.badge}`}
                >
                  {stage.deals} deals
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {stage.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">Open pipeline value</p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Client Accounts
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Your highest-value client relationships
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {clients.length} accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Industry</th>
                <th className="px-5 py-3 font-semibold">Account Owner</th>
                <th className="px-5 py-3 font-semibold">Deal Value</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.name} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-slate-900">
                        {client.name}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {client.industry}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {client.owner}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-slate-900">
                    {client.value}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        STATUS_STYLES[client.status]
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveClientName(client.name)}
                      aria-label={`View ${client.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Client"
        description="Create a new client account in the CRM."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="client-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Client name
            </label>
            <input
              id="client-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Stark Industries"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="client-industry"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Industry
            </label>
            <input
              id="client-industry"
              name="industry"
              type="text"
              required
              value={form.industry}
              onChange={handleChange}
              placeholder="e.g. Technology"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="client-owner"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Account owner
            </label>
            <input
              id="client-owner"
              name="owner"
              type="text"
              required
              value={form.owner}
              onChange={handleChange}
              placeholder="e.g. Priya Sharma"
              className={FIELD_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="client-value"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Deal value (USD)
              </label>
              <input
                id="client-value"
                name="value"
                type="number"
                required
                min="0"
                step="1000"
                value={form.value}
                onChange={handleChange}
                placeholder="240000"
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="client-status"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="client-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={FIELD_CLASS}
              >
                <option>Active</option>
                <option>Prospect</option>
                <option>At Risk</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Add Client
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={activeClient !== undefined}
        onClose={() => setActiveClientName(null)}
        title={activeClient ? activeClient.name : 'Client Details'}
        description="Client account overview and relationship details."
      >
        {activeClient ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  {activeClient.name}
                </p>
                <p className="text-xs text-slate-500">{activeClient.industry}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Account Owner
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {activeClient.owner}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Deal Value
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums text-slate-900">
                  {activeClient.value}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Industry
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {activeClient.industry}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      STATUS_STYLES[activeClient.status]
                    }`}
                  >
                    {activeClient.status}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setActiveClientName(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
