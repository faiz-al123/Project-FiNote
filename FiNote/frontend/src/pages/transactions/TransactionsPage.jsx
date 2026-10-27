
import { useEffect, useState } from 'react'
import Logo from '../../assets/Logo.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'

import {
  createTransaction,
  getTransactionCategories,
} from '../../api/transaction.api'

import './TransactionsPage.css'
import '../dashboard/DashboardPage.css'

const CATEGORY_DEFAULTS = [
  { id: 'makanan', label: 'Makanan', icon: 'food' },
  { id: 'transportasi', label: 'Transportasi', icon: 'transport' },
  { id: 'belanja', label: 'Belanja', icon: 'shopping' },
  { id: 'tagihan', label: 'Tagihan', icon: 'bill' },
  { id: 'hiburan', label: 'Hiburan', icon: 'game' },
]

function getCategoriesFromResponse(result) {
  const candidates = [
    result?.data?.categories,
    result?.data?.kategori,
    result?.data?.kategoris,
    result?.categories,
    result?.kategori,
    result?.data,
  ]

  return candidates.find(Array.isArray) || []
}

function getCategoryId(category) {
  return (
    category.kategori_id ??
    category.category_id ??
    category.id
  )
}

function getCategoryName(category) {
  return (
    category.nama_kategori ??
    category.nama ??
    category.name ??
    category.namaKategori ??
    ''
  )
}

function formatCategory(category) {
  const name = getCategoryName(category)

  const fallback = CATEGORY_DEFAULTS.find(
    (item) => item.label.toLowerCase() === String(name).toLowerCase(),
  )

  return {
    id: getCategoryId(category),
    label: name,
    icon: fallback?.icon || 'category',
  }
}

function CategoryIcon({ type }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (type) {
    case 'food':
      return (
        <svg {...common}>
          <path d="M4 3v7a3 3 0 0 0 6 0V3" />
          <path d="M7 3v18M4 7h6" />
          <path d="M16 3v18M16 3c4 2 4 7 0 9" />
        </svg>
      )

    case 'transport':
      return (
        <svg {...common}>
          <path d="M3 13V8l2-4h12l3 4v5" />
          <path d="M3 13h17v5H3z" />
          <circle cx="6.5" cy="18" r="1.5" />
          <circle cx="16.5" cy="18" r="1.5" />
          <path d="M7 8h9" />
        </svg>
      )

    case 'shopping':
      return (
        <svg {...common}>
          <path d="M3 4h2l2.5 12h11L21 8H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="17" cy="20" r="1" />
        </svg>
      )

    case 'bill':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )

    case 'game':
      return (
        <svg {...common}>
          <path d="M6 7h12a4 4 0 0 1 4 4l-1 6a2 2 0 0 1-3 1l-3-3H9l-3 3a2 2 0 0 1-3-1l-1-6a4 4 0 0 1 4-4Z" />
          <path d="M7 10v4M5 12h4M16 11h.01M19 13h.01" />
        </svg>
      )

    default:
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 14h3" />
        </svg>
      )
  }
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3h12l4 4v14H3V3z" />
      <path d="M7 3v6h10V3M7 21v-8h10v8" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

function TransactionsPage({ user, onLogout, onNavigate }) {
  const [nominal, setNominal] = useState('')
  const [kategori, setKategori] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [catatan, setCatatan] = useState('')

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoryError, setCategoryError] = useState('')

  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [notice, setNotice] = useState(null)

  const username =
    user?.username ||
    user?.nama ||
    user?.name ||
    'Pengguna'

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setLoadingCategories(true)
      setCategoryError('')

      try {
        const result = await getTransactionCategories()
        const rows = getCategoriesFromResponse(result)

        const formatted = rows
          .map(formatCategory)
          .filter((item) => item.id != null && item.label)

        if (!cancelled) {
          setCategories(formatted)

          if (formatted.length === 0) {
            setCategoryError(
              'Kategori belum tersedia. Periksa data kategori pada backend.',
            )
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCategoryError(
            error.message ||
              'Gagal mengambil kategori dari server.',
          )

          if (error.status === 401) {
            onLogout?.()
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false)
        }
      }
    }

    loadCategories()

    return () => {
      cancelled = true
    }
  }, [onLogout])

  function handleNominalChange(event) {
    setNominal(event.target.value)
    setFieldErrors((previous) => ({
      ...previous,
      nominal: '',
    }))
    setNotice(null)
  }

  function handleCategorySelect(categoryId) {
    setKategori(String(categoryId))
    setFieldErrors((previous) => ({
      ...previous,
      kategori: '',
    }))
    setNotice(null)
  }

  function resetForm() {
    setNominal('')
    setKategori('')
    setTanggal('')
    setCatatan('')
    setFieldErrors({})
    setNotice(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    setNotice(null)

    const errors = {}
    const amount = Number(nominal)

    if (!nominal.trim()) {
      errors.nominal = 'Nominal wajib diisi.'
    } else if (!Number.isFinite(amount) || amount <= 0) {
      errors.nominal = 'Nominal harus lebih besar dari 0.'
    }

    if (!kategori) {
      errors.kategori = 'Kategori wajib dipilih.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)

      const missing = []

      if (errors.nominal) missing.push('nominal')
      if (errors.kategori) missing.push('kategori')

      setNotice({
        type: 'error',
        message:
          missing.length === 2
            ? 'Nominal dan kategori wajib diisi.'
            : missing[0] === 'nominal'
              ? errors.nominal
              : errors.kategori,
      })

      return
    }

    const selectedCategory = categories.find(
      (item) => String(item.id) === String(kategori),
    )

    if (!selectedCategory) {
      setFieldErrors({
        kategori: 'Silakan pilih kategori yang tersedia.',
      })

      setNotice({
        type: 'error',
        message: 'Kategori tidak valid. Silakan pilih kembali.',
      })

      return
    }

    const payload = {
      kategori_id: Number(selectedCategory.id),
      jumlah: amount,
      catatan: catatan.trim(),
    }

    // Jika tanggal kosong, jangan kirim field tanggal.
    // Backend akan menetapkan tanggal hari ini.
    if (tanggal) {
      payload.tanggal = tanggal
    }

    setSaving(true)

    try {
      const result = await createTransaction(payload)

      setNotice({
        type: 'success',
        message:
          result.message ||
          'Pengeluaran berhasil dicatat.',
      })

      setNominal('')
      setKategori('')
      setTanggal('')
      setCatatan('')
      setFieldErrors({})
    } catch (error) {
      if (error.status === 401) {
        setNotice({
          type: 'error',
          message:
            'Sesi login berakhir. Silakan login kembali.',
        })

        onLogout?.()
        return
      }

      setNotice({
        type: 'error',
        message:
          error.message ||
          'Transaksi gagal disimpan. Silakan coba kembali.',
      })
    } finally {
      setSaving(false)
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'riwayat' },
    { id: 'pengingat', label: 'pengingat', icon: 'pengingat' },
  ]

  function renderMenuIcon(icon) {
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

      default:
        return (
          <svg {...props}>
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
            <path d="M10 21h4" />
          </svg>
        )
    }
  }

  return (
    <div className="dashboard-layout transaction-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <img src={Logo} alt="FiNote" />
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
                if (
                  item.id === 'dashboard' ||
                  item.id === 'transaksi'
                ) {
                  onNavigate?.(item.id)
                }
              }}
            >
              <span className="dashboard-menu-icon">
                {renderMenuIcon(item.icon)}
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

      <div className="dashboard-workspace transaction-workspace">
        <header className="transaction-header">
          <div className="transaction-header-icon">
            <CalendarIcon />
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
                  fieldErrors.nominal ? 'has-error' : ''
                }`}
              >
                <span className="transaction-currency">Rp</span>

                <input
                  id="transaction-amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  value={nominal}
                  onChange={handleNominalChange}
                  aria-invalid={Boolean(fieldErrors.nominal)}
                  aria-describedby={
                    fieldErrors.nominal
                      ? 'transaction-amount-error'
                      : undefined
                  }
                />
              </div>

              {fieldErrors.nominal && (
                <p
                  id="transaction-amount-error"
                  className="transaction-inline-error"
                >
                  {fieldErrors.nominal}
                </p>
              )}
            </section>

            <section className="transaction-field">
              <div className="transaction-field-heading">
                <label>Kategori Transaksi</label>

                <span className="transaction-hint">
                  Pilih yang paling sesuai
                </span>
              </div>

              {loadingCategories ? (
                <p role="status">
                  Memuat kategori dari server...
                </p>
              ) : categoryError ? (
                <p className="transaction-inline-error" role="alert">
                  {categoryError}
                </p>
              ) : (
                <div className="transaction-categories">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`transaction-category ${
                        String(kategori) === String(category.id)
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        handleCategorySelect(category.id)
                      }
                      aria-pressed={
                        String(kategori) === String(category.id)
                      }
                    >
                      <CategoryIcon type={category.icon} />
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {fieldErrors.kategori && (
                <p className="transaction-inline-error">
                  {fieldErrors.kategori}
                </p>
              )}
            </section>

            <section className="transaction-field">
              <div className="transaction-field-heading">
                <label htmlFor="transaction-date">
                  Tanggal Transaksi
                </label>
              </div>

              <div className="transaction-standard-input">
                <CalendarIcon />

                <input
                  id="transaction-date"
                  type="date"
                  value={tanggal}
                  onChange={(event) => {
                    setTanggal(event.target.value)
                    setNotice(null)
                  }}
                />
              </div>

              <p className="transaction-hint transaction-date-hint">
                Kosongkan jika menggunakan tanggal hari ini.
              </p>
            </section>

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
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </span>

                <textarea
                  id="transaction-description"
                  rows="2"
                  placeholder="Contoh: Makan siang nasi padang"
                  value={catatan}
                  onChange={(event) => {
                    setCatatan(event.target.value)
                    setNotice(null)
                  }}
                />
              </div>
            </section>

            <div
              className="transaction-feedback"
              aria-live="polite"
            >
              {notice && (
                <p
                  className={`transaction-notice ${
                    notice.type === 'success'
                      ? 'is-success'
                      : 'is-error'
                  }`}
                  role={notice.type === 'error' ? 'alert' : 'status'}
                >
                  <InfoIcon />
                  <span>{notice.message}</span>
                </p>
              )}
            </div>

            <div className="transaction-actions">
              <button
                type="submit"
                className="transaction-save-button"
                disabled={saving || loadingCategories || Boolean(categoryError)}
              >
                <SaveIcon />
                <span>
                  {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </span>
              </button>

              <button
                type="button"
                className="transaction-reset-button"
                onClick={resetForm}
                disabled={saving}
              >
                <ResetIcon />
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
