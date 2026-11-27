import LogoImg from '../../assets1/sidebar/Logo.png'
import DashboardImg from '../../assets1/sidebar/Dashboard.png'
import TransaksiImg from '../../assets1/sidebar/Transaksi.png'
import RiwayatImg from '../../assets1/sidebar/Riwayat.png'
import PengingatImg from '../../assets1/sidebar/Pengingat.png'
import KeluarImg from '../../assets1/sidebar/Keluar.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'
import './Sidebar.css'

// Daftar menu sidebar. Id harus sama dengan nama halaman di App.jsx.
// Gambar menu (ikon + teks) berasal dari src/assets1/sidebar.
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', image: DashboardImg },
  { id: 'transaksi', label: 'Transaksi', image: TransaksiImg },
  { id: 'riwayat', label: 'Riwayat', image: RiwayatImg },
  { id: 'pengingat', label: 'Pengingat', image: PengingatImg },
]

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
      <div className="sidebar-card">
        <div className="sidebar-brand">
          <img src={LogoImg} alt="FiNote - Kelola Keuangan, Raih Masa Depan" />
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
                <img src={item.image} alt={item.label} draggable="false" />
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

            <span className="sidebar-user-info">
              <span className="sidebar-user-name" title={username}>
                {username}
              </span>
              <span className="sidebar-user-role">mahasiswa</span>
            </span>

            <svg
              className="sidebar-user-chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <img src={KeluarImg} alt="Keluar" draggable="false" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar