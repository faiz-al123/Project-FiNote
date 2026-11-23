import { useEffect, useMemo, useState } from 'react'

import CalendarIcon from '../../assets/riwayat-assets/calender.png'

import {
  getAllTransactionHistory,
  getTransactionCategories,
} from '../../api/transaction.api'

import AppLayout from '../../components/layout/AppLayout'
import HistoryTableSkeleton from './HistoryTableSkeleton'
import './HistoryPage.css'

const ROWS_PER_PAGE = 10

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

// Desain menampilkan nominal tanpa "Rp" (contoh: 50.000)
function formatNominal(value) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDate(dateString) {
  if (!dateString) return '-'

  const parts = String(dateString).slice(0, 10).split('-')

  if (parts.length !== 3) return dateString

  return `${parts[2]}/${parts[1]}/${parts[0]}`
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

// Kolom tanggal: teks selalu tampil dd/mm/yyyy (tidak mengikuti bahasa browser).
// Input tanggal asli dibuat transparan di atasnya agar kalender tetap bisa dibuka.
function DateControl({ value, onChange, label }) {
  function openPicker(event) {
    try {
      event.currentTarget.showPicker?.()
    } catch {
      // browser lama: kalender dibuka lewat klik bawaan
    }
  }

  return (
    <div className={`history-date-control ${value ? '' : 'is-empty'}`}>
      <span className={`history-date-text ${value ? '' : 'is-placeholder'}`}>
        {value ? formatDate(value) : 'dd/mm/yyyy'}
      </span>
      <img className="custom-date-icon" src={CalendarIcon} alt="" />
      <input
        type="date"
        className="history-native-date"
        value={value}
        onChange={onChange}
        onClick={openPicker}
        aria-label={label}
      />
    </div>
  )
}

// Nomor halaman: halaman pertama, terakhir, dan sekitar halaman aktif
function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const result = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push(`gap-${page}`)
    }
    result.push(page)
  })

  return result
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


  // Memuat kategori dan seluruh riwayat transaksi.
  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      setLoading(true)
      setError('')

      try {
        // Skeleton tampil minimal 500 ms agar tidak berkedip
        const minimumLoading = new Promise((r) => setTimeout(r, 500))

        const [categoryResult, historyResult] = await Promise.all([
          getTransactionCategories(),
          getAllTransactionHistory(),
          minimumLoading,
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

  // Hitung data yang sudah difilter
  const filteredTransactions = useMemo(() => {
    if (!appliedFilters) return transactions

    return transactions.filter((item) => {
      const date = String(item.tanggal || '').slice(0, 10)
      const amount = Number(item.jumlah) || 0
      const categoryId = String(
        item.kategori_id ??
        item.category_id ??
        '',
      )

      if (appliedFilters.startDate && date < appliedFilters.startDate) return false
      if (appliedFilters.endDate && date > appliedFilters.endDate) return false
      if (appliedFilters.category && categoryId !== String(appliedFilters.category)) return false
      if (appliedFilters.minimum !== null && amount < appliedFilters.minimum) return false
      if (appliedFilters.maximum !== null && amount > appliedFilters.maximum) return false

      return true
    })
  }, [transactions, appliedFilters])

  // Pagination dihitung dari data yang sudah difilter
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / ROWS_PER_PAGE),
  )

  const visibleTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE
    return filteredTransactions.slice(
      startIndex,
      startIndex + ROWS_PER_PAGE,
    )
  }, [filteredTransactions, currentPage])

  function changePage(page) {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppLayout
      activePage="riwayat"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      className="history-layout"
    >
      <div className="app-workspace history-workspace">
        <main className="history-main">

          {/* HEADER */}
          <header className="history-header">
            <span className="history-header-icon">
              <img src={CalendarIcon} alt="" />
            </span>
            <div>
              <h1>Riwayat transaksi</h1>
              <p>lihat semua catatan pengeluaranmu disini</p>
            </div>
          </header>

          {/* FILTER */}
          <form className="history-filter-panel" onSubmit={handleFilter}>

            {/* RENTANG TANGGAL */}
            <div className="history-range-fields">
              <label className="history-range-label">Rentang tanggal</label>

              <div className="history-date-range-controls">
                <DateControl
                  value={startDate}
                  label="Tanggal awal"
                  onChange={(event) => {
                    setStartDate(event.target.value)
                    setFilterError('')
                  }}
                />

                <span className="history-date-arrow">→</span>

                <DateControl
                  value={endDate}
                  label="Tanggal akhir"
                  onChange={(event) => {
                    setEndDate(event.target.value)
                    setFilterError('')
                  }}
                />
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
                  <option value="">pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
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
                    setMinimumAmount(formatNominalInput(event.target.value))
                    setFilterError('')
                  }}
                />
                <span className="history-range-separator">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="100.000"
                  aria-label="Nominal maksimum"
                  value={maximumAmount}
                  onChange={(event) => {
                    setMaximumAmount(formatNominalInput(event.target.value))
                    setFilterError('')
                  }}
                />
              </div>
            </div>

            {/* TOMBOL FILTER */}
            <button type="submit" className="history-filter-button" disabled={loading}>
              <SearchIcon />
              <span>Filter</span>
            </button>

            {/* TOMBOL RESET */}
            {(startDate || endDate || categoryFilter || minimumAmount || maximumAmount) && (
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
                    <th>Tanggal</th>
                    <th>Deskripsi</th>
                    <th>kategori</th>
                    <th>nominal</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <HistoryTableSkeleton />
                  ) : visibleTransactions.length > 0 ? (
                    visibleTransactions.map((item, index) => (
                      <tr key={item.transaksi_id || index}>
                        <td>{formatDate(item.tanggal)}</td>
                        <td>{item.catatan || '-'}</td>
                        <td>{item.nama_kategori || '-'}</td>
                        <td className="history-amount">
                          {formatNominal(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="history-empty-state-cell">
                        <div className="history-empty-badge">
                          {appliedFilters 
                            ? '"Data Tidak Ditemukan"' 
                            : 'Belum ada Catatan Riwayat Pengeluaran, silahkan klik "Transaksi" .'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PAGINATION (DIPINDAHKAN KE LUAR TABEL SECTION AGAR DI BAWAH KOTAK PUTIH) */}
          {!loading && filteredTransactions.length > 0 && (
            <nav className="history-pagination" aria-label="Pagination riwayat transaksi">
              <button
                type="button"
                className="history-page-arrow"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
              >
                ←
              </button>

              {getPageNumbers(currentPage, totalPages).map((page) => (
                typeof page === 'string' ? (
                  <span key={page} className="history-page-ellipsis">…</span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={`history-page-button ${currentPage === page ? 'active' : ''}`}
                    onClick={() => changePage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                type="button"
                className="history-page-arrow"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Halaman berikutnya"
              >
                →
              </button>
            </nav>
          )}

        </main>
      </div>
    </AppLayout>
  )
}

export default HistoryPage