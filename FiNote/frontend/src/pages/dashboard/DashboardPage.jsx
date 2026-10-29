
import { useEffect, useState } from 'react'
import Logo from '../../assets/Logo.png'
import Bell from '../../assets/dashboard-assets/Bell.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'
import {
  getDashboardSummary,
  getDashboardCategorySummary,
} from '../../api/dashboard.api'
import { formatRupiah } from '../../utils/format'
import './DashboardPage.css'

function DashboardPage({ user, onLogout, onNavigate }) {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const [summaryData, categoryData] = await Promise.all([
          getDashboardSummary(),
          getDashboardCategorySummary(),
        ])

        if (cancelled) return

        setSummary(summaryData)
        setCategories(
          Array.isArray(categoryData?.categories)
            ? categoryData.categories
            : [],
        )
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          onLogout()
          return
        }

        setError(
          err.message || 'Data dashboard gagal dimuat.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [onLogout])

  const totalHari =
    summary?.total_pengeluaran_hari_ini ?? 0

  const totalBulan =
    summary?.total_pengeluaran_bulan_ini ?? 0

  const belumAdaCatatan =
    !loading &&
    !error &&
    totalHari === 0 &&
    totalBulan === 0

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

  const nilaiTerbesar = Math.max(
    1,
    ...categories.map((item) => Number(item.total) || 0),
  )

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'riwayat' },
    { id: 'pengingat', label: 'pengingat', icon: 'pengingat' },
  ]

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
            <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
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

  const handleMenuClick = (menuId) => {
    if (menuId === 'dashboard') {
      setActiveMenu('dashboard')
      return
    }

    if (menuId === 'transaksi') {
      onNavigate?.('transaksi')
      return
    }

    setActiveMenu(menuId)
  }

  return (
    <div className="dashboard-layout">
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

          {error && (
            <div
              className="dashboard-error-message"
              role="alert"
            >
              {error}
            </div>
          )}

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

          {belumAdaCatatan && (
            <div
              className="dashboard-empty-message"
              role="status"
            >
              Silakan klik “Transaksi” untuk mencatat pengeluaranmu.
            </div>
          )}

          <section
            className="dashboard-chart-card"
            aria-label="Grafik pengeluaran berdasarkan kategori"
          >
            <div className="dashboard-chart-heading">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <rect x="5" y="12" width="4" height="9" />
                <rect x="10" y="7" width="4" height="14" />
                <rect x="15" y="3" width="4" height="18" />
              </svg>

              <h2>Grafik Pengeluaran berdasarkan kategori</h2>
            </div>

            <div className="dashboard-chart-divider" />

            {loading ? (
              <div className="dashboard-chart-state">
                Memuat grafik...
              </div>
            ) : error ? (
              <div className="dashboard-chart-state">
                Grafik belum dapat ditampilkan.
              </div>
            ) : categories.length === 0 ? (
              <div className="dashboard-chart-state">
                Belum ada data kategori.
              </div>
            ) : (
              <div className="dashboard-chart">
                {categories.map((category) => {
                  const total = Number(category.total) || 0
                  const tinggi =
                    total > 0
                      ? Math.max((total / nilaiTerbesar) * 100, 4)
                      : 0

                  const tertinggi =
                    total > 0 && total === nilaiTerbesar

                  return (
                    <div
                      className={`dashboard-chart-column ${
                        tertinggi ? 'highest' : ''
                      }`}
                      key={category.kategori_id}
                    >
                      <span className="dashboard-chart-value">
                        {total > 0
                          ? new Intl.NumberFormat('id-ID').format(total)
                          : ''}
                      </span>

                      <div className="dashboard-chart-bar-area">
                        <div
                          className="dashboard-chart-bar"
                          style={{ height: `${tinggi}%` }}
                          title={`${category.nama_kategori}: ${formatRupiah(total)}`}
                        />
                      </div>

                      <span className="dashboard-chart-label">
                        {category.nama_kategori}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="dashboard-chart-baseline" />

            <div className="dashboard-chart-legend">
              <span className="dashboard-legend-dot" />
              <span>Tertinggi</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
