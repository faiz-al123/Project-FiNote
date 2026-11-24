import Logo from '../../assets/Logo.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'
import './Sidebar.css'

// Daftar menu sidebar. Id harus sama dengan nama halaman di App.jsx.
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transaksi', label: 'Transaksi' },
  { id: 'riwayat', label: 'Riwayat' },
  { id: 'pengingat', label: 'pengingat' },
]

function MenuIcon({ id }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (id) {
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

/**
 * Sidebar yang dipakai semua halaman setelah login.
 *
 * Props:
 * - activePage : id menu yang sedang aktif ('dashboard' | 'transaksi' | 'riwayat' | 'pengingat' | 'profil')
 * - user       : data pengguna dari App.jsx
 * - onNavigate : dipanggil dengan id halaman tujuan
 * - onLogout   : dipanggil saat tombol keluar ditekan
 */
function Sidebar({ activePage, user, onNavigate, onLogout }) {
  const username =
    user?.username ||
    user?.nama ||
    user?.name ||
    'Pengguna'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={Logo} alt="FiNote" />
      </div>

      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {MENU_ITEMS.map((item) => {
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate?.(item.id)}
            >
              <span className="sidebar-item-icon">
                <MenuIcon id={item.id} />
              </span>

              <span className="sidebar-item-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        {/* Kartu profil: klik untuk membuka halaman Profil */}
        <button
          type="button"
          className={`sidebar-user ${activePage === 'profil' ? 'active' : ''}`}
          aria-current={activePage === 'profil' ? 'page' : undefined}
          aria-label={`Buka profil ${username}`}
          onClick={() => onNavigate?.('profil')}
        >
          <img src={ProfileIcon} alt="" className="sidebar-user-icon" />

          <div className="sidebar-user-info">
            <span className="sidebar-user-name" title={username}>
              {username}
            </span>

            <span className="sidebar-user-role">mahasiswa</span>
          </div>
        </button>

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          
        </button>
      </div>
    </aside>
  )
}

export default Sidebar