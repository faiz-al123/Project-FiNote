// Halaman sementara untuk membuktikan login berhasil.
// Ganti dengan dashboard FiNote yang sebenarnya di sprint berikutnya.

function DashboardPage({ user, onLogout }) {
  return (
    <main className="dashboard-placeholder">
      <h1>Halo, {user.nama}!</h1>
      <p>Login berhasil. Kamu masuk sebagai {user.email}.</p>

      <button
        type="button"
        className="login-button dashboard-logout"
        onClick={onLogout}
      >
        Keluar
      </button>
    </main>
  )
}

export default DashboardPage
