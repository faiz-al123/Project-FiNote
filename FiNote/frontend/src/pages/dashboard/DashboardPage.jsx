
import { useState } from 'react'
import Logo from '../../assets/Logo.png'
import Bell from '../../assets/dashboard-assets/Bell.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'
import './DashboardPage.css'

function DashboardPage({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard')

  // Nama dari backend saat ini tersimpan sebagai user.nama.
  // username dan name menjadi fallback bila format user berubah.
  const username =
    user?.username ||
    user?.nama ||
    user?.name ||
    'Pengguna'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'riwayat' },
    { id: 'pengingat', label: 'Pengingat', icon: 'pengingat' },
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

      case 'pengaturan':
        return (
          <svg {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
          </svg>
        )

      default:
        return null
    }
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

        {/* MENU BAWAH */}
        <div className="dashboard-sidebar-bottom">
          <button
            type="button"
            className={`dashboard-menu-item dashboard-settings ${
              activeMenu === 'pengaturan' ? 'active' : ''
            }`}
            aria-current={
              activeMenu === 'pengaturan' ? 'page' : undefined
            }
            onClick={() => setActiveMenu('pengaturan')}
          >
            <span className="dashboard-menu-icon">
              {renderIcon('pengaturan')}
            </span>

            <span className="dashboard-menu-label">
              Pengaturan
            </span>
          </button>

          {/* NAMA PENGGUNA */}
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

          {/* TOMBOL KELUAR TETAP DIPERTAHANKAN */}
          <button
            type="button"
            className="dashboard-logout"
            onClick={onLogout}
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* AREA KONTEN */}
      <div className="dashboard-workspace">
        <main className="dashboard-main">
          {/* HEADER */}
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
              onClick={() => setActiveMenu('pengingat')}
            >
              <img src={Bell} alt="" />
            </button>
          </header>

          {/* BANNER KETIKA BELUM ADA TRANSAKSI */}
          <div className="dashboard-empty-message" role="status">
            silahkan klik “Transaksi” untuk mencatat pengeluaran mu
          </div>

          {/* KARTU RINGKASAN */}
          <section
            className="dashboard-summary"
            aria-label="Ringkasan pengeluaran"
          >
            <article className="dashboard-summary-card">
              <h2>Pengeluaran hari ini</h2>
              <p className="dashboard-summary-value">-</p>
            </article>

            <article className="dashboard-summary-card">
              <h2>Pengeluaran bulan ini</h2>
              <p className="dashboard-summary-value">-</p>
            </article>
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
