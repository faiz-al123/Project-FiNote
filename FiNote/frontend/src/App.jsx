
import { useCallback, useEffect, useState } from 'react'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import TransactionsPage from './pages/transactions/TransactionsPage'
import HistoryPage from './pages/history/HistoryPage'
import RemindersPage from './pages/reminders/RemindersPage'

import {
  clearSession,
  getCurrentUser,
  getToken,
} from './api/auth.api'

import './App.css'

// Halaman yang boleh dibuka setelah login
const ALLOWED_PAGES = [
  'dashboard',
  'transaksi',
  'riwayat',
  'pengingat',
]

const PAGE_STORAGE_KEY = 'finote_page'

// Membaca halaman terakhir yang tersimpan (aman jika storage gagal)
function getSavedPage() {
  try {
    const saved = sessionStorage.getItem(PAGE_STORAGE_KEY)
    return ALLOWED_PAGES.includes(saved) ? saved : 'dashboard'
  } catch {
    return 'dashboard'
  }
}

function savePage(page) {
  try {
    sessionStorage.setItem(PAGE_STORAGE_KEY, page)
  } catch {
    // diabaikan, aplikasi tetap berjalan tanpa penyimpanan
  }
}

function clearSavedPage() {
  try {
    sessionStorage.removeItem(PAGE_STORAGE_KEY)
  } catch {
    // diabaikan
  }
}

function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')

  const [checkingSession, setCheckingSession] = useState(
    () => Boolean(getToken()),
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
          setPage(getSavedPage())
        }
      })
      .catch((error) => {
        if (
          error.status === 401 ||
          error.status === 404
        ) {
          clearSession()
          clearSavedPage()
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
    savePage('dashboard')
    setPage('dashboard')
  }

  const handleRegisterSuccess = (registeredUser) => {
    setUser(registeredUser)
    savePage('dashboard')
    setPage('dashboard')
  }

  const handleLogout = useCallback(() => {
    clearSession()
    clearSavedPage()
    setUser(null)
    setPage('login')
  }, [])

  const handleNavigate = (destination) => {
    if (ALLOWED_PAGES.includes(destination)) {
      savePage(destination)
      setPage(destination)
    }
  }

  if (checkingSession) {
    return <p className="session-loading">Memuat...</p>
  }

  if (!user) {
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

  if (page === 'transaksi') {
    return (
      <TransactionsPage
        user={user}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />
    )
  }

  if (page === 'riwayat') {
    return (
      <HistoryPage
        user={user}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />
    )
  }

  if (page === 'pengingat') {
    return (
      <RemindersPage
        user={user}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />
    )
  }

  return (
    <DashboardPage
      user={user}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  )
}

export default App
