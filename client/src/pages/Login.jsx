import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, Building2, Lock, LogIn, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const MOCK_CREDENTIALS = [
  { role: 'Super Admin', email: 'ceo@itshrms.com' },
  { role: 'HR', email: 'hr@itshrms.com' },
  { role: 'Manager', email: 'pm@itshrms.com' },
  { role: 'Employee', email: 'emp@itshrms.com' },
  { role: 'Finance', email: 'finance@itshrms.com' },
  { role: 'Sales & Marketing', email: 'sales@itshrms.com' },
  { role: 'Client', email: 'client@itshrms.com' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            ITSHRMS
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your workspace
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@itshrms.com"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Demo credentials
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
              {MOCK_CREDENTIALS.map((credential) => (
                <li
                  key={credential.email}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="font-medium text-slate-700">
                    {credential.role}
                  </span>
                  <span className="font-mono">{credential.email}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Password for all accounts:{' '}
              <span className="font-mono font-semibold text-slate-700">
                password
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
