
import { useEffect, useRef, useState } from 'react'

import Logo from '../../assets/Logo.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'

import ForkKnifeIcon from '../../assets/transaksi-assets/ForkKnife.png'
import TransportIcon from '../../assets/transaksi-assets/mdi_transportation.png'
import ShoppingCartIcon from '../../assets/transaksi-assets/ShoppingCartSimple.png'
import BillIcon from '../../assets/transaksi-assets/majesticons_paper-fold-text-line.png'
import GameControllerIcon from '../../assets/transaksi-assets/GameController.png'
import CalendarDotsIcon from '../../assets/transaksi-assets/CalendarDots.png'

import {
  createTransaction,
  getTransactionCategories,
} from '../../api/transaction.api'

import './TransactionsPage.css'
import '../dashboard/DashboardPage.css'

// Urutan kategori mengikuti desain UI/UX
const CATEGORY_DEFAULTS = [
  { id: 'belanja', label: 'Belanja', icon: 'shopping' },
  { id: 'hiburan', label: 'Hiburan', icon: 'game' },
  { id: 'lainnya', label: 'Lainnya', icon: 'category' },
  { id: 'makanan', label: 'Makanan', icon: 'food' },
  { id: 'tagihan', label: 'Tagihan', icon: 'bill' },
  { id: 'transportasi', label: 'Transportasi', icon: 'transport' },
]

const CATEGORY_ORDER = [
  'Belanja',
  'Hiburan',
  'Lainnya',
  'Makanan',
  'Tagihan',
  'Transportasi',
]

// Mengambil daftar kategori dari response API
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

// Mengambil ID kategori
function getCategoryId(category) {
  return (
    category.kategori_id ??
    category.category_id ??
    category.id
  )
}

// Mengambil nama kategori
function getCategoryName(category) {
  return (
    category.nama_kategori ??
    category.nama ??
    category.name ??
    category.namaKategori ??
    ''
  )
}

// Mengubah format kategori API
function formatCategory(category) {
  const name = getCategoryName(category)

  const fallback = CATEGORY_DEFAULTS.find(
    (item) =>
      item.label.toLowerCase() === String(name).toLowerCase(),
  )

  return {
    id: getCategoryId(category),
    label: name,
    icon: fallback?.icon || 'category',
  }
}

// Mengatur gambar ikon kategori
const CATEGORY_ICON_IMAGES = {
  food: ForkKnifeIcon,
  transport: TransportIcon,
  shopping: ShoppingCartIcon,
  bill: BillIcon,
  game: GameControllerIcon,
}

// Komponen ikon kategori
function CategoryIcon({ type }) {
  const imageSource = CATEGORY_ICON_IMAGES[type]

  if (imageSource) {
    return (
      <img
        src={imageSource}
        alt=""
        className="transaction-category-icon"
        aria-hidden="true"
      />
    )
  }

  return (
    <svg
      className="transaction-category-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 14h3" />
    </svg>
  )
}

// Ikon simpan
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

// Ikon reset
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

// Ikon informasi notifikasi
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

  const tanggalInputRef = useRef(null)

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

  // ========================================
  // MENGAMBIL KATEGORI DARI BACKEND
  // ========================================

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
          .sort((a, b) => {
            const indexA = CATEGORY_ORDER.findIndex(
              (name) =>
                name.toLowerCase() ===
                String(a.label).toLowerCase(),
            )

            const indexB = CATEGORY_ORDER.findIndex(
              (name) =>
                name.toLowerCase() ===
                String(b.label).toLowerCase(),
            )

            // Kategori yang tidak dikenal tetap ditampilkan
            const orderA =
              indexA === -1
                ? CATEGORY_ORDER.length
                : indexA

            const orderB =
              indexB === -1
                ? CATEGORY_ORDER.length
                : indexB

            return orderA - orderB
          })

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

  // ========================================
  // MEMBUKA KALENDER
  // ========================================

  function openDatePicker() {
    const dateInput = tanggalInputRef.current

    if (!dateInput) return

    try {
      if (typeof dateInput.showPicker === 'function') {
        dateInput.showPicker()
      } else {
        dateInput.focus()
      }
    } catch {
      dateInput.focus()
    }
  }

  // ========================================
  // PERUBAHAN NOMINAL
  // ========================================

  function handleNominalChange(event) {
    setNominal(event.target.value)

    setFieldErrors((previous) => ({
      ...previous,
      nominal: '',
    }))

    setNotice(null)
  }

  // ========================================
  // MEMILIH KATEGORI
  // ========================================

  function handleCategorySelect(categoryId) {
    setKategori(String(categoryId))

    setFieldErrors((previous) => ({
      ...previous,
      kategori: '',
    }))

    setNotice(null)
  }

  // ========================================
  // RESET FORM
  // ========================================

  function resetForm() {
    setNominal('')
    setKategori('')
    setTanggal('')
    setCatatan('')
    setFieldErrors({})
    setNotice(null)
  }

  // ========================================
  // MENYIMPAN TRANSAKSI
  // ========================================

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    setNotice(null)

    const errors = {}
    const amount = Number(nominal)

    // Validasi nominal
    if (!nominal.trim()) {
      errors.nominal = 'Nominal wajib diisi'
    } else if (!Number.isFinite(amount) || amount <= 0) {
      errors.nominal = 'Nominal harus lebih besar dari 0'
    }

    // Validasi kategori
    if (!kategori) {
      errors.kategori = 'Kategori wajib dipilih'
    }

    // Jika terdapat kesalahan validasi
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)

      const missing = []

      if (errors.nominal) missing.push('nominal')
      if (errors.kategori) missing.push('kategori')

      setNotice({
        type: 'error',
        message:
          missing.length === 2
            ? 'Nominal dan kategori wajib diisi'
            : missing[0] === 'nominal'
              ? errors.nominal
              : errors.kategori,
      })

      return
    }

    // Memastikan kategori tersedia
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

    // Data yang dikirim ke backend
    const payload = {
      kategori_id: Number(selectedCategory.id),
      jumlah: amount,
      catatan: catatan.trim(),
    }

    // Jika tanggal kosong, backend menetapkan tanggal hari ini
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

      // Kosongkan form setelah berhasil
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

  // ========================================
  // MENU SIDEBAR
  // ========================================

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'riwayat' },
    { id: 'pengingat', label: 'pengingat', icon: 'pengingat' },
  ]

  // ========================================
  // IKON SIDEBAR
  // ========================================

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
            <rect
              x="3.5"
              y="3.5"
              width="17"
              height="17"
              rx="1"
            />
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

  // ========================================
  // TAMPILAN HALAMAN TRANSAKSI
  // ========================================

  return (
    <div className="dashboard-layout transaction-layout">

      {/* SIDEBAR */}
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
                  item.id === 'transaksi' ||
                  item.id === 'riwayat' ||
                  item.id === 'pengingat'
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

        {/* PROFIL DAN LOGOUT */}
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

      {/* AREA KONTEN */}
      <div className="dashboard-workspace transaction-workspace">

        {/* HEADER */}
        <header className="transaction-header">

          <div className="transaction-header-icon">
            <img src={CalendarDotsIcon} alt="" />
          </div>

          <div>
            <h1>Catat Transaksi Pengeluaranmu</h1>

            <p>
              Lengkapi data transaksi di bawah ini dengan benar
            </p>
          </div>

        </header>

        {/* FORM TRANSAKSI */}
        <main className="transaction-main">

          <form
            className="transaction-card"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* NOMINAL UANG */}
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

                <span className="transaction-currency">
                  Rp
                </span>

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
                />

              </div>

            </section>

            {/* KATEGORI TRANSAKSI */}
            <section className="transaction-field">

              <div className="transaction-field-heading">

                <label>
                  Kategori Transaksi
                </label>

                <span className="transaction-hint">
                  Pilih yang paling sesuai
                </span>

              </div>

              {loadingCategories ? (
                <p role="status">
                  Memuat kategori dari server...
                </p>
              ) : categoryError ? (
                <p
                  className="transaction-inline-error"
                  role="alert"
                >
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

                      <span>
                        {category.label}
                      </span>

                    </button>
                  ))}

                </div>
              )}

            </section>

            {/* TANGGAL TRANSAKSI */}
            <section className="transaction-field">

              <div className="transaction-field-heading">

                <label htmlFor="transaction-date">
                  Tanggal Transaksi
                </label>

              </div>

              <div
                className="transaction-date-input"
                onClick={openDatePicker}
              >

                <button
                  type="button"
                  className="transaction-date-icon-button"
                  aria-label="Pilih tanggal transaksi"
                  onClick={(event) => {
                    event.stopPropagation()
                    openDatePicker()
                  }}
                >
                  <img src={CalendarDotsIcon} alt="" />
                </button>

                <span
                  className={`transaction-date-display ${
                    tanggal ? 'has-date' : ''
                  }`}
                >
                  {tanggal
                    ? new Date(
                        `${tanggal}T00:00:00`,
                      ).toLocaleDateString(
                        'id-ID',
                        {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        },
                      )
                    : 'tanggal'}
                </span>

                <input
                  ref={tanggalInputRef}
                  id="transaction-date"
                  className="transaction-date-native-input"
                  type="date"
                  value={tanggal}
                  tabIndex={-1}
                  onChange={(event) => {
                    setTanggal(event.target.value)
                    setNotice(null)
                  }}
                  aria-label="Tanggal transaksi"
                />

              </div>

            </section>

            {/* KETERANGAN TAMBAHAN */}
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

            {/* NOTIFIKASI */}
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
                  role={
                    notice.type === 'error'
                      ? 'alert'
                      : 'status'
                  }
                >

                  <InfoIcon />

                  <span>
                    {notice.message}
                  </span>

                </p>
              )}

            </div>

            {/* TOMBOL SIMPAN DAN RESET */}
            <div className="transaction-actions">

              <button
                type="submit"
                className="transaction-save-button"
                disabled={
                  saving ||
                  loadingCategories ||
                  Boolean(categoryError)
                }
              >

                <SaveIcon />

                <span>
                  {saving
                    ? 'Menyimpan...'
                    : 'Simpan Transaksi'}
                </span>

              </button>

              <button
                type="button"
                className="transaction-reset-button"
                onClick={resetForm}
                disabled={saving}
              >

                <ResetIcon />

                <span>
                  Reset
                </span>

              </button>

            </div>

          </form>

        </main>

      </div>
    </div>
  )
}

export default TransactionsPage
