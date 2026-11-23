import Sidebar from './Sidebar'
import './Layout.css'

/**
 * Kerangka halaman setelah login: Sidebar di kiri, konten halaman di kanan.
 *
 * Isi halaman (children) dibungkus sendiri oleh tiap halaman,
 * biasanya dengan <div className="app-workspace">.
 * className dipakai untuk kelas khusus halaman (contoh: "history-layout").
 */
function AppLayout({
  activePage,
  user,
  onNavigate,
  onLogout,
  className = '',
  children,
}) {
  return (
    <div className={`app-layout ${className}`.trim()}>
      <Sidebar
        activePage={activePage}
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {children}
    </div>
  )
}

export default AppLayout