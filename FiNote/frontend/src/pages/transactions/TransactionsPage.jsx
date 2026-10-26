
import { useState } from 'react'
import Logo from '../../assets/Logo.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'
import './TransactionsPage.css'

const categories = [
  { id: 'makanan', label: 'Makanan', icon: 'makanan' },
  { id: 'transportasi', label: 'Transportasi', icon: 'transportasi' },
  { id: 'belanja', label: 'Belanja', icon: 'belanja' },
  { id: 'tagihan', label: 'Tagihan', icon: 'tagihan' },
  { id: 'hiburan', label: 'Hiburan', icon: 'hiburan' },
]

function MenuIcon({ type }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (type) {
    case 'dashboard':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="3" />
          <circle cx="17" cy="7" r="3" />
          <circle cx="7" cy="17" r="3" />
          <circle cx="17" cy="17" r="3" />
        </svg>
      )

    case 'transaksi':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
          <path d="M12 7v10M7 12h10" />
        </svg>
      )

    case 'riwayat':
      return (
        <svg {...common}>
          <path d="M6 3h9l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M15 3v5h5" />
        </svg>
      )

    case 'pengingat':
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
          <path d="M10 21h4M5 5 7 3M19 3l2 2" />
        </svg>
      )

    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 17h2" />
        </svg>
      )

    case 'makanan':
      return (
        <svg {...common}>
          <path d="M4 3v7M7 3v7M10 3v7M7 10v11M17 3c-3 4-3 8 0 9v9M17 3v9h3V3" />
        </svg>
      )

    case 'transportasi':
      return (
        <svg {...common}>
          <path d="M3 15V8h11l4 4h3v6H3z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
          <path d="M14 8v4h4M3 12h4" />
        </svg>
      )

    case 'belanja':
      return (
        <svg {...common}>
          <path d="M3 4h2l2.5 12h11L21 8H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="17" cy="20" r="1" />
        </svg>
      )

    case 'tagihan':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h4" />
        </svg>
      )

    case 'hiburan':
      return (
        <svg {...common}>
          <path d="M7 8h10a4 4 0 0 1 4 4l1 5a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-5a4 4 0 0 1 4-4Z" />
          <path d="M8 11v4M6 13h4M16 12h.01M18 14h.01" />
        </svg>
      )

    case 'save':
      return (
        <svg {...common}>
          <path d="M5 3h12l4 4v14H3V3z" />
          <path d="M7 3v6h10V3M7 21v-8h10v8" />
        </svg>
      )

    case 'reset':
      return (
        <svg {...common}>
          <path d="M4 11a8 8 0 1 1 2 6" />
          <path d="M4 5v6h6" />
        </svg>
      )

    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      )

    default:
      return null
  }
}

function TransactionsPage({ user, onLogout, onNavigate }) {
  const [nominal, setNominal] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [showError, setShowError] = useState(false)

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

  const handleReset = () => {
    setNominal('')
    setCategory('')
    setDate('')
    setDescription('')
    setShowError(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    // Low fidelity: belum menyimpan ke backend.
    if (!nominal || Number(nominal) <= 0) {
      setShowError(true)
      return
    }

    if (!category || !date) {
      setShowError(true)
      return
    }

    // Belum ada proses POST transaksi pada tahap ini.
    setShowError(false)
  }

  const handleNominalChange = (event) => {
    const value = event.target.value

    // Hanya menerima angka.
    if (/^\d*$/.test(value)) {
      setNominal(value)
      setShowError(false)
    }
  }

  return (
    <div className="dashboard-layout transaction-layout">
      {/* SIDEBAR: mengikuti Dashboard */}
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
                item.id === 'transaksi' ? 'active' : ''
              }`}
              aria-current={
                item.id === 'transaksi' ? 'page' : undefined
              }
              onClick={() => {
                if (item.id !== 'transaksi') {
                  onNavigate?.(item.id)
                }
              }}
            >
              <span className="dashboard-menu-icon">
                <MenuIcon type={item.icon} />
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

      {/* KONTEN TRANSAKSI */}
      <div className="dashboard-workspace transaction-workspace">
        <header className="transaction-header">
          <div className="transaction-header-icon">
            <MenuIcon type="calendar" />
          </div>

          <div>
            <h1>Catat Transaksi Pengeluaranmu</h1>
            <p>
              Lengkapi data transaksi di bawah ini dengan benar
            </p>
          </div>
        </header>

        <main className="transaction-main">
          <form
            className="transaction-card"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* NOMINAL */}
            <section className="transaction-field">
              <div className="transaction-field-heading">
                <label htmlFor="transaction-amount">
                  Nominal Uang
                </label>

                <span className="transaction-required">
                  *Wajib diisi
                </span>
              </div>

              <div
                className={`transaction-amount-input ${
                  showError && (!nominal || Number(nominal) <= 0)
                    ? 'has-error'
                    : ''
                }`}
              >
                <span className="transaction-currency">Rp</span>

                <input
                  id="transaction-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={nominal}
                  onChange={handleNominalChange}
                  aria-describedby={
                    showError ? 'transaction-error' : undefined
                  }
                />
              </div>
            </section>

            {/* KATEGORI */}
            <section className="transaction-field">
              <div className="transaction-field-heading">
                <label>Kategori Transaksi</label>
                <span className="transaction-hint">
                  Pilih yang paling sesuai
                </span>
              </div>

              <div
                className="transaction-categories"
                role="group"
                aria-label="Kategori transaksi"
              >
                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`transaction-category ${
                      category === item.id ? 'selected' : ''
                    }`}
                    aria-pressed={category === item.id}
                    onClick={() => {
                      setCategory(item.id)
                      setShowError(false)
                    }}
                  >
                    <MenuIcon type={item.icon} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* TANGGAL */}
            <section className="transaction-field">
              <div className="transaction-field-heading">
                <label htmlFor="transaction-date">
                  Tanggal Transaksi
                </label>
              </div>

              <div className="transaction-standard-input">
                <MenuIcon type="calendar" />

                <input
                  id="transaction-date"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value)
                    setShowError(false)
                  }}
                />
              </div>
            </section>

            {/* KETERANGAN */}
            <section className="transaction-field">
              <div className="transaction-field-heading">
                <label htmlFor="transaction-description">
                  Keterangan Tambahan
                </label>

                <span className="transaction-hint">
                  Opsional
                </span>
              </div>

              <div className="transaction-description-input">
                <span className="transaction-description-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 7h14M5 12h14M5 17h14" />
                  </svg>
                </span>

                <textarea
                  id="transaction-description"
                  placeholder="Contoh: Makan siang nasi padang"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={2}
                />
              </div>
            </section>

            {/* PESAN VALIDASI */}
            <div className="transaction-feedback">
              {showError && (
                <p
                  id="transaction-error"
                  className="transaction-error"
                  role="alert"
                >
                  <MenuIcon type="info" />
                  {!nominal || Number(nominal) <= 0
                    ? 'Nominal wajib diisi'
                    : 'Kategori dan tanggal wajib diisi'}
                </p>
              )}
            </div>

            {/* TOMBOL */}
            <div className="transaction-actions">
              <button
                type="submit"
                className="transaction-save-button"
              >
                <MenuIcon type="save" />
                <span>Simpan Transaksi</span>
              </button>

              <button
                type="button"
                className="transaction-reset-button"
                onClick={handleReset}
              >
                <MenuIcon type="reset" />
                <span>Reset</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

export default TransactionsPage
