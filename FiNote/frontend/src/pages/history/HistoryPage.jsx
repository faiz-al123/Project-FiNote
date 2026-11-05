
import { useEffect, useMemo, useState } from 'react'

import Logo from '../../assets/Logo.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'

import {
  getAllTransactionHistory,
  getTransactionCategories,
} from '../../api/transaction.api'

import { formatRupiah } from '../../utils/format'

import './HistoryPage.css'
import '../dashboard/DashboardPage.css'

const ROWS_PER_PAGE = 15

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

function formatDate(dateString) {
  if (!dateString) return '-'

  const parts = String(dateString).slice(0, 10).split('-')

  if (parts.length !== 3) return dateString

  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

function parseNominal(value) {
  if (value === '' || value == null) return null

  const cleaned = String(value).replace(/[^\d]/g, '')

  if (!cleaned) return null

  return Number(cleaned)
}

function formatNominalInput(value) {
  const number = parseNominal(value)

  if (number === null) return ''

  return new Intl.NumberFormat('id-ID').format(number)
}

function CalendarIcon() {
  return (
    <svg
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="7" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
    </svg>
  )
}

function TransactionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M6 3h9l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M15 3v5h5" />
    </svg>
  )
}

function ReminderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4M5 5 7 3M19 3l2 2" />
    </svg>
  )
}

function HistoryPage({ user, onLogout, onNavigate }) {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [categoryFilter, setCategoryFilter] = useState('')
  const [minimumAmount, setMinimumAmount] = useState('')
  const [maximumAmount, setMaximumAmount] = useState('')

  const [appliedFilters, setAppliedFilters] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')

  const username =
    user?.username ||
    user?.nama ||
    user?.name ||
    'Pengguna'

  // Memuat kategori dan seluruh riwayat transaksi.
  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      setLoading(true)
      setError('')

      try {
        const [categoryResult, historyResult] = await Promise.all([
          getTransactionCategories(),
          getAllTransactionHistory(),
        ])

        if (cancelled) return

        const categoryRows = getCategoriesFromResponse(categoryResult)

        setCategories(
          categoryRows
            .map((item) => ({
              id: getCategoryId(item),
              name: getCategoryName(item),
            }))
            .filter((item) => item.id != null && item.name),
        )

        setTransactions(historyResult)
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          onLogout?.()
          return
        }

        setError(
          err.message ||
          'Riwayat transaksi gagal dimuat. Silakan coba kembali.',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      cancelled = true
    }
  }, [onLogout])

  // Memeriksa dan menerapkan filter.
  function handleFilter(event) {
    event.preventDefault()

    const minimum = parseNominal(minimumAmount)
    const maximum = parseNominal(maximumAmount)

    if (
      minimum !== null &&
      maximum !== null &&
      minimum > maximum
    ) {
      setFilterError(
        'Nominal minimum tidak boleh lebih besar dari nominal maksimum.',
      )
      return
    }

    if (startDate && endDate && startDate > endDate) {
      setFilterError(
        'Tanggal awal tidak boleh lebih besar dari tanggal akhir.',
      )
      return
    }

    setFilterError('')

    setAppliedFilters({
      startDate,
      endDate,
      category: categoryFilter,
      minimum,
      maximum,
    })

    setCurrentPage(1)
  }

  // Mengembalikan filter ke kondisi awal.
  function handleResetFilter() {
    setStartDate('')
    setEndDate('')
    setCategoryFilter('')
    setMinimumAmount('')
    setMaximumAmount('')
    setAppliedFilters(null)
    setFilterError('')
    setCurrentPage(1)
  }

  // Memeriksa apakah transaksi sesuai dengan filter.
  function isTransactionMatched(item) {
    if (!appliedFilters) return true

    const date = String(item.tanggal || '').slice(0, 10)
    const amount = Number(item.jumlah) || 0

    const categoryId = String(
      item.kategori_id ??
      item.category_id ??
      '',
    )

    if (
      appliedFilters.startDate &&
      date < appliedFilters.startDate
    ) {
      return false
    }

    if (
      appliedFilters.endDate &&
      date > appliedFilters.endDate
    ) {
      return false
    }

    if (
      appliedFilters.category &&
      categoryId !== String(appliedFilters.category)
    ) {
      return false
    }

    if (
      appliedFilters.minimum !== null &&
      amount < appliedFilters.minimum
    ) {
      return false
    }

    if (
      appliedFilters.maximum !== null &&
      amount > appliedFilters.maximum
    ) {
      return false
    }

    return true
  }

  // Pagination.
  const totalPages = Math.max(
    1,
    Math.ceil(transactions.length / ROWS_PER_PAGE),
  )

  const visibleTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE

    return transactions.slice(
      startIndex,
      startIndex + ROWS_PER_PAGE,
    )
  }, [transactions, currentPage])

  function changePage(page) {
    if (page < 1 || page > totalPages) return

    setCurrentPage(page)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
    },
    {
      id: 'transaksi',
      label: 'Transaksi',
      icon: <TransactionIcon />,
    },
    {
      id: 'riwayat',
      label: 'Riwayat',
      icon: <HistoryIcon />,
    },
    {
      id: 'pengingat',
      label: 'pengingat',
      icon: <ReminderIcon />,
    },
  ]

  return (
    <div className="dashboard-layout history-layout">

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
                item.id === 'riwayat' ? 'active' : ''
              }`}
              aria-current={
                item.id === 'riwayat' ? 'page' : undefined
              }
              onClick={() => {
                if (
                  item.id === 'dashboard' ||
                  item.id === 'transaksi' ||
                  item.id === 'riwayat'
                ) {
                  onNavigate?.(item.id)
                }
              }}
            >
              <span className="dashboard-menu-icon">
                {item.icon}
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

      {/* KONTEN RIWAYAT */}
      <div className="dashboard-workspace history-workspace">
        <main className="history-main">

          {/* HEADER */}
          <header className="history-header">
            <span className="history-header-icon">
              <CalendarIcon />
            </span>

            <div>
              <h1>Riwayat transaksi</h1>
              <p>lihat semua catatan pengeluaranmu disini</p>
            </div>
          </header>

          {/* FILTER */}
          <form
            className="history-filter-panel"
            onSubmit={handleFilter}
          >

            {/* RENTANG TANGGAL */}
            <div className="history-filter-field history-date-range-field">
              <label className="history-field-label">
                Rentang tanggal
              </label>

              <div className="history-date-range-controls">
                <div className="history-date-control">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value)
                      setFilterError('')
                    }}
                    aria-label="Tanggal awal"
                  />
                </div>

                <span className="history-date-arrow">
                  →
                </span>

                <div className="history-date-control">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value)
                      setFilterError('')
                    }}
                    aria-label="Tanggal akhir"
                  />
                </div>
              </div>
            </div>

            {/* FILTER KATEGORI */}
            <div className="history-filter-field">
              <label className="history-field-label">
                pilih kategori
              </label>

              <div className="history-category-field">
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value)
                    setFilterError('')
                  }}
                  aria-label="Pilih kategori"
                >
                  <option value="">
                    pilih kategori
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <ChevronDownIcon />
              </div>
            </div>

            {/* RENTANG NOMINAL */}
            <div className="history-range-fields">
              <label className="history-range-label">
                rentang nominal <span>*</span>
              </label>

              <div className="history-range-inputs">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  aria-label="Nominal minimum"
                  value={minimumAmount}
                  onChange={(event) => {
                    setMinimumAmount(
                      formatNominalInput(event.target.value),
                    )
                    setFilterError('')
                  }}
                />

                <span className="history-range-separator">
                  -
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="100.000"
                  aria-label="Nominal maksimum"
                  value={maximumAmount}
                  onChange={(event) => {
                    setMaximumAmount(
                      formatNominalInput(event.target.value),
                    )
                    setFilterError('')
                  }}
                />
              </div>
            </div>

            {/* TOMBOL FILTER */}
            <button
              type="submit"
              className="history-filter-button"
              disabled={loading}
            >
              <SearchIcon />
              <span>Filter</span>
            </button>

            {/* TOMBOL RESET */}
            {(startDate ||
              endDate ||
              categoryFilter ||
              minimumAmount ||
              maximumAmount) && (
              <button
                type="button"
                className="history-reset-button"
                onClick={handleResetFilter}
                disabled={loading}
              >
                Reset
              </button>
            )}
          </form>

          {/* PESAN ERROR */}
          {filterError && (
            <div className="history-error" role="alert">
              {filterError}
            </div>
          )}

          {error && (
            <div className="history-error" role="alert">
              {error}
            </div>
          )}

          {/* TABEL RIWAYAT */}
          <section className="history-table-section">
            <div className="history-table-scroll">
              <table className="history-table">
                <thead>
                  <tr>
                    <th className="history-number-column">NO</th>
                    <th>Tanggal</th>
                    <th>Deskripsi</th>
                    <th>Kategori</th>
                    <th>Nominal</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="history-state-cell"
                      >
                        Memuat riwayat transaksi...
                      </td>
                    </tr>
                  ) : visibleTransactions.length > 0 ? (
                    visibleTransactions.map((item, index) => (
                      <tr
                        key={item.transaksi_id}
                        className={
                          isTransactionMatched(item)
                            ? ''
                            : 'history-row-dimmed'
                        }
                      >
                        <td className="history-number-column">
                          {(currentPage - 1) * ROWS_PER_PAGE +
                            index +
                            1}
                        </td>

                        <td>{formatDate(item.tanggal)}</td>

                        <td>
                          {item.catatan || '-'}
                        </td>

                        <td>
                          {item.nama_kategori || '-'}
                        </td>

                        <td className="history-amount">
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="history-state-cell"
                      >
                        Tidak ada riwayat transaksi yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <nav
              className="history-pagination"
              aria-label="Pagination riwayat transaksi"
            >
              <button
                type="button"
                className="history-page-arrow"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1,
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`history-page-button ${
                    currentPage === page ? 'active' : ''
                  }`}
                  onClick={() => changePage(page)}
                  aria-current={
                    currentPage === page ? 'page' : undefined
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="history-page-arrow"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </nav>
          )}

          {!loading && transactions.length > 0 && (
            <p className="history-total">
              Menampilkan {visibleTransactions.length} dari{' '}
              {transactions.length} transaksi
            </p>
          )}

        </main>
      </div>
    </div>
  )
}

export default HistoryPage
