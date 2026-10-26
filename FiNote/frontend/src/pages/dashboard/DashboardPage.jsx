
import { useEffect, useState } from 'react'
import Logo from '../../assets/Logo.png'
import Bell from '../../assets/dashboard-assets/Bell.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'
import { getDashboardSummary } from '../../api/dashboard.api'
import { formatRupiah } from '../../utils/format'
import './DashboardPage.css'

function DashboardPage({ user, onLogout, onNavigate }) {
  const [activeMenu, setActiveMenu] = useState('dashboard')

  // Data ringkasan dari backend
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    getDashboardSummary()
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((err) => {
        if (cancelled) return

        // Token kedaluwarsa atau tidak valid
        if (err.status === 401) {
          onLogout()
          return
        }

        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [onLogout])

  const totalHari = summary?.total_pengeluaran_hari_ini ?? 0
  const totalBulan = summary?.total_pengeluaran_bulan_ini ?? 0

  // Belum ada catatan pengeluaran
  const belumAdaCatatan =
    !loading && !error && totalHari === 0 && totalBulan === 0

  const tampil = (nilai) => {
    if (loading) return '...'
    if (error) return '-'
    return formatRupiah(nilai)
  }

  const username =
    user?.username ||
    user?.nama ||
    user?.name ||
    'Pengguna'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'riwayat' },
    { id: 'pengingat', label: 'pengingat', icon: 'pengingat' },
  ]

  // Ikon sidebar
  const renderIcon = (icon) => {
    const props = {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
    }

    switch (icon) {
      case 'dashboard':
        return (
          <svg {...props}>
            <circle cx="7" cy="7" r="3" />
            <circle cx="17" cy="7" r="3" />
            <circle cx="7" cy="17" r="3" />
            <circle cx="17" cy="17" r="3" />
          </svg>
        )

      case 'transaksi':
        return (
          <svg {...props}>
            <rect
              x="3.5"
              y="3.5"
              width="17"
              height="17"
              rx="1"
            />
            <path d="M12 7v10M7 12h10" />
          </svg>
        )

      case 'riwayat':
        return (
          <svg {...props}>
            <path d="M6 3h9l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M15 3v5h5" />
          </svg>
        )

      case 'pengingat':
        return (
          <svg {...props}>
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
            <path d="M10 21h4" />
            <path d="M5 5 7 3M19 3l2 2" />
          </svg>
        )

      default:
        return null
    }
  }

  // Navigasi sidebar
  const handleMenuClick = (menuId) => {
    if (menuId === 'dashboard') {
      setActiveMenu('dashboard')
      return
    }

    if (menuId === 'transaksi') {
      onNavigate?.('transaksi')
      return
    }

    // Halaman Riwayat dan Pengingat belum dibuat.
    // Untuk sementara, tandai menu yang dipilih.
    setActiveMenu(menuId)
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <img src={Logo} alt="FINote" />
        </div>

        <nav
          className="dashboard-navigation"
          aria-label="Navigasi utama"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dashboard-menu-item ${
                activeMenu === item.id ? 'active' : ''
              }`}
              aria-current={
                activeMenu === item.id ? 'page' : undefined
              }
              onClick={() => handleMenuClick(item.id)}
            >
              <span className="dashboard-menu-icon">
                {renderIcon(item.icon)}
              </span>

              <span className="dashboard-menu-label">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* PROFIL DAN TOMBOL KELUAR */}
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-profile">
            <img
              src={ProfileIcon}
              alt=""
              className="dashboard-user-icon"
            />

            <div className="dashboard-user-info">
              <span
                className="dashboard-user-name"
                title={username}
              >
                {username}
              </span>

              <span className="dashboard-user-role">
                mahasiswa
              </span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-logout"
            onClick={onLogout}
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* KONTEN DASHBOARD */}
      <div className="dashboard-workspace">
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-heading">
              <h1>Halo, sahabat Finote !</h1>
              <p>
                Pantau uang keluar kamu dengan mudah hari ini.
              </p>
            </div>

            <button
              type="button"
              className="dashboard-notification"
              aria-label="Buka pengingat"
              title="Pengingat"
              onClick={() => handleMenuClick('pengingat')}
            >
              <img src={Bell} alt="" />
            </button>
          </header>

          {/* Gagal memuat data backend */}
          {error && (
            <div
              className="dashboard-empty-message"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Belum ada catatan pengeluaran */}
          {belumAdaCatatan && (
            <div
              className="dashboard-empty-message"
              role="status"
            >
              silahkan klik “Transaksi” untuk mencatat pengeluaran mu
            </div>
          )}

          {/* Ringkasan pengeluaran harian dan bulanan */}
          <section
            className="dashboard-summary"
            aria-label="Ringkasan pengeluaran"
          >
            <article className="dashboard-summary-card">
              <h2>Pengeluaran hari ini</h2>

              <p className="dashboard-summary-value">
                {tampil(totalHari)}
              </p>
            </article>

            <article className="dashboard-summary-card">
              <h2>Pengeluaran bulan ini</h2>

              <p className="dashboard-summary-value">
                {tampil(totalBulan)}
              </p>
            </article>
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
