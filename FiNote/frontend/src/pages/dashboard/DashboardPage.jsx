
import { useState } from 'react'
import Logo from '../../assets/Logo.png'
import './DashboardPage.css'

function DashboardPage({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [tanggal, setTanggal] = useState('01')
  const [bulan, setBulan] = useState('01')
  const [tahun, setTahun] = useState('2026')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'riwayat' },
    { id: 'pengingat', label: 'pengingat', icon: 'pengingat' },
  ]

  const renderIcon = (icon, size = 26) => {
    const props = {
      width: size,
      height: size,
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
            <path d="M3 5 5 3M21 5l-2-2" />
          </svg>
        )

      case 'pengaturan':
        return (
          <svg {...props}>
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
            <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
          </svg>
        )

      case 'notifikasi':
        return (
          <svg {...props} width={32} height={32}>
            <path d="M24 11a8 8 0 0 0-16 0c0 9-4 9-4 12h24c0-3-4-3-4-12Z" />
            <path d="M13 28h6" />
            <path d="M4 7 7 3M28 7l-3-4" />
          </svg>
        )

      case 'profil':
        return (
          <svg {...props} width={40} height={40}>
            <circle cx="12" cy="7.5" r="5" />
            <path d="M2.5 21c.5-5 4.5-8 9.5-8s9 3 9.5 8" />
          </svg>
        )

      default:
        return null
    }
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
              onClick={() => setActiveMenu(item.id)}
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
          <button
            type="button"
            className={`dashboard-menu-item dashboard-settings ${
              activeMenu === 'pengaturan' ? 'active' : ''
            }`}
            onClick={() => setActiveMenu('pengaturan')}
          >
            <span className="dashboard-menu-icon">
              {renderIcon('pengaturan')}
            </span>
            <span className="dashboard-menu-label">
              Pengaturan
            </span>
          </button>

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
        <header className="dashboard-header">
          <div className="dashboard-header-spacer" />

          <button
            type="button"
            className="dashboard-header-icon"
            aria-label="Notifikasi"
            onClick={() => setActiveMenu('pengingat')}
          >
            {renderIcon('notifikasi', 32)}
          </button>

          <button
            type="button"
            className="dashboard-avatar"
            aria-label={`Profil ${
              user?.nama || user?.username || 'Pengguna'
            }`}
            title={user?.nama || user?.username || 'Pengguna'}
            onClick={() => setActiveMenu('pengaturan')}
          >
            {renderIcon('profil', 40)}
          </button>
        </header>

        <main className="dashboard-main">
          <h1 className="dashboard-sr-only">
            Dashboard FINote
          </h1>

          <section
            className="dashboard-summary"
            aria-label="Ringkasan pengeluaran"
          >
            <article className="dashboard-summary-card">
              <h2>Pengeluaran harian</h2>
              <p className="dashboard-summary-value">-</p>
            </article>

            <article className="dashboard-summary-card">
              <h2>Pengeluaran bulanan</h2>
              <p className="dashboard-summary-value">-</p>
            </article>

            <section className="dashboard-date-picker">
              <h2>pilih tanggal</h2>

              <div className="dashboard-date-fields">
                <input
                  aria-label="Tanggal"
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={tanggal}
                  onChange={(event) =>
                    setTanggal(event.target.value.replace(/\D/g, ''))
                  }
                />

                <input
                  aria-label="Bulan"
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={bulan}
                  onChange={(event) =>
                    setBulan(event.target.value.replace(/\D/g, ''))
                  }
                />

                <input
                  aria-label="Tahun"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={tahun}
                  onChange={(event) =>
                    setTahun(event.target.value.replace(/\D/g, ''))
                  }
                />
              </div>
            </section>
          </section>

          <section
            className="dashboard-chart-section"
            aria-label="Grafik pengeluaran"
          >
            <p className="dashboard-empty-message">
              silahkan klik “Transaksi” untuk mencatat pengeluaran mu
            </p>

            <div
              className="dashboard-empty-chart"
              role="img"
              aria-label="Area grafik pengeluaran yang belum memiliki data"
            >
              <div className="dashboard-chart-y-axis" />
              <div className="dashboard-chart-x-axis" />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
