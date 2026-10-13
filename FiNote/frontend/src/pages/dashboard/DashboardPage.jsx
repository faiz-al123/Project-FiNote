
import './DashboardPage.css'

function DashboardPage({ user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'riwayat' },
    { id: 'anggaran', label: 'Anggaran', icon: 'anggaran' },
  ]

  const renderIcon = (icon) => {
    const commonProps = {
      width: 25,
      height: 25,
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
          <svg {...commonProps}>
            <rect x="4" y="3" width="6" height="8" rx="3" />
            <rect x="14" y="3" width="6" height="8" rx="3" />
            <rect x="4" y="13" width="6" height="8" rx="3" />
            <rect x="14" y="13" width="6" height="8" rx="3" />
          </svg>
        )

      case 'transaksi':
        return (
          <svg {...commonProps}>
            <path d="M8 7 4 11l4 4" />
            <path d="M4 11h9" />
            <path d="m16 17 4-4-4-4" />
            <path d="M20 13h-9" />
          </svg>
        )

      case 'riwayat':
        return (
          <svg {...commonProps}>
            <path d="M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M14 3v5h5" />
          </svg>
        )

      case 'anggaran':
        return (
          <svg {...commonProps}>
            <path d="M12 3v9l7.8 4.5" />
            <path d="M20.5 8.5A9 9 0 1 1 8 3.5" />
            <path d="M8 3.5V8h4.5" />
          </svg>
        )

      case 'pengaturan':
        return (
          <svg {...commonProps}>
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
            <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
          </svg>
        )

      default:
        return null
    }
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-profile">
          <div
            className="dashboard-profile-placeholder"
            aria-label="Area foto profil"
          />
        </div>

        <nav
          className="dashboard-navigation"
          aria-label="Navigasi utama"
        >
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`dashboard-menu-item ${
                index === 0 ? 'active' : ''
              }`}
              aria-current={index === 0 ? 'page' : undefined}
              title={item.label}
              onClick={() => {
                if (index !== 0) {
                  // Halaman menu lain akan dibuat pada tahap berikutnya.
                }
              }}
            >
              <span className="dashboard-menu-icon">
                {renderIcon(item.icon)}
              </span>

              <span className="dashboard-menu-placeholder" />
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <button
            type="button"
            className="dashboard-menu-item dashboard-settings"
            title="Pengaturan"
            aria-label="Pengaturan"
          >
            <span className="dashboard-menu-icon">
              {renderIcon('pengaturan')}
            </span>

            <span className="dashboard-menu-placeholder settings-placeholder" />
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

      <main className="dashboard-main">
        <h1 className="dashboard-sr-only">
          Dashboard FINote
        </h1>

        <span className="dashboard-sr-only">
          Selamat datang, {user?.nama || user?.username || 'Pengguna'}.
        </span>
      </main>
    </div>
  )
}

export default DashboardPage
