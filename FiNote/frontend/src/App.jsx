import { useEffect, useState } from 'react'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import {
  clearSession,
  getCurrentUser,
  getToken,
} from './api/auth.api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  const [page, setPage] = useState('login')

  const [checkingSession, setCheckingSession] = useState(() =>
    Boolean(getToken()),
  )

  useEffect(() => {
    const token = getToken()

    if (!token) {
      return
    }

    let cancelled = false

    getCurrentUser(token)
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser)
        }
      })
      .catch((error) => {
        // Token kedaluwarsa / tidak valid / user sudah dihapus.
        if (error.status === 401 || error.status === 404) {
          clearSession()
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingSession(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser)
    setPage('login')
  }

  const handleRegisterSuccess = (registeredUser) => {
    setUser(registeredUser)
    setPage('login')
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setPage('login')
  }

  if (checkingSession) {
    return <p className="session-loading">Memuat...</p>
  }

  if (user) {
    return (
      <DashboardPage
        user={user}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'register') {
    return (
      <RegisterPage
        onRegisterSuccess={handleRegisterSuccess}
        onLoginClick={() => setPage('login')}
      />
    )
  }

  return (
    <LoginPage
      onLoginSuccess={handleLoginSuccess}
      onRegisterClick={() => setPage('register')}
    />
  )
}

export default App