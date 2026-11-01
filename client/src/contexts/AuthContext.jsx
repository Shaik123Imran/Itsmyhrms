import { createContext, useContext, useState } from 'react'

const MOCK_USERS = [
  {
    email: 'ceo@itshrms.com',
    password: 'password',
    role: 'CEO',
    name: 'Aarav Mehta',
  },
  {
    email: 'hr@itshrms.com',
    password: 'password',
    role: 'HR Head',
    name: 'Priya Sharma',
  },
  {
    email: 'pm@itshrms.com',
    password: 'password',
    role: 'Project Manager',
    name: 'Rohan Verma',
  },
  {
    email: 'emp@itshrms.com',
    password: 'password',
    role: 'Employee',
    name: 'Neha Kapoor',
  },
]

const AuthContext = createContext(null)
const STORAGE_KEY = 'itshrms.user'

function readStoredUser() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored)
    return parsed?.email && parsed?.role ? parsed : null
  } catch {
    return null
  }
}

function persistUser(user) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    return
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase()
    const match = MOCK_USERS.find(
      (candidate) => candidate.email === normalizedEmail,
    )

    if (!match || match.password !== password) {
      throw new Error('Invalid email or password. Please try again.')
    }

    const authenticatedUser = {
      email: match.email,
      role: match.role,
      name: match.name,
    }
    setUser(authenticatedUser)
    persistUser(authenticatedUser)
    return true
  }

  const logout = () => {
    setUser(null)
    persistUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
