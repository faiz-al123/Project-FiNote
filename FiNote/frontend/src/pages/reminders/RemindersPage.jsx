import { useEffect, useMemo, useRef, useState } from 'react'

import Logo from '../../assets/Logo.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'

// Aset dari folder pengingat-assets yang cocok dengan desain UI/UX.
// Header, tombol tambah, tombol filter, header tabel, dan tombol selesai
// SENGAJA dibuat dengan HTML/CSS (bukan gambar) karena di desain
// elemen-elemen itu punya state aktif/nonaktif dan harus tajam di layar apa pun.
import DeleteImage from '../../assets/pengingat-assets/Delete.png'

import RedCalendar from '../../assets/pengingat-assets/RedCalender.png'
import BlueCalendar from '../../assets/pengingat-assets/BlueCalender.png'
import GreenCalendar from '../../assets/pengingat-assets/GreenCalender.png'
import OrangeCalendar from '../../assets/pengingat-assets/OrangeCalender.png'

import BadgeTagihan from '../../assets/pengingat-assets/Tagihan.png'
import BadgeMakanan from '../../assets/pengingat-assets/Makanan.png'
import BadgeBelanja from '../../assets/pengingat-assets/Belanja.png'
import BadgeHiburan from '../../assets/pengingat-assets/Hiburan.png'
import BadgeTransportasi from '../../assets/pengingat-assets/Tansportasi.png'

import {
  getReminders,
  createReminder,
  completeReminder,
  deleteReminder,
} from '../../api/reminder.api'

import { getTransactionCategories } from '../../api/transaction.api'

import '../dashboard/DashboardPage.css'
import './RemindersPage.css'

const NOTICE_DURATION = 3500
const SEARCH_DELAY = 350

// Sesuai desain (skenario 4): pengingat yang sudah terlewat
// tombol "selesai"-nya nonaktif (abu-abu).
const BLOCK_OVERDUE_COMPLETE = true

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April',
  'Mei', 'Juni', 'Juli', 'Agustus',
  'September', 'Oktober', 'November', 'Desember',
]

const EMPTY_SUMMARY = {
  terdekat: 0,
  total: 0,
  selesai: 0,
  terlewat: 0,
}

const EMPTY_FORM = {
  deskripsi: '',
  kategori_id: '',
  jumlah: '',
  tanggal: '',
}

const FILTERS = [
  { id: 'semua', label: 'semua' },
  { id: 'terdekat', label: 'terdekat' },
  { id: 'terlewat', label: 'terlewat' },
  { id: 'selesai', label: 'selesai' },
]

const SUMMARY_CARDS = [
  {
    key: 'terdekat',
    filter: 'terdekat',
    tone: 'nearest',
    icon: RedCalendar,
    title: 'Terdekat',
    note: '< 3 hari',
  },
  {
    key: 'total',
    filter: 'semua',
    tone: 'total',
    icon: BlueCalendar,
    title: 'Total satu bulan',
    note: 'semua pengingat',
  },
  {
    key: 'selesai',
    filter: 'selesai',
    tone: 'completed',
    icon: GreenCalendar,
    title: 'Selesai',
    note: 'sudah ditandai selesai',
  },
  {
    key: 'terlewat',
    filter: 'terlewat',
    tone: 'missed',
    icon: OrangeCalendar,
    title: 'Terlewat',
    note: 'belum ditandai selesai',
  },
]

const CATEGORY_BADGES = {
  tagihan: BadgeTagihan,
  makanan: BadgeMakanan,
  belanja: BadgeBelanja,
  hiburan: BadgeHiburan,
  transportasi: BadgeTransportasi,
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transaksi', label: 'Transaksi' },
  { id: 'riwayat', label: 'Riwayat' },
  { id: 'pengingat', label: 'pengingat' },
]

/* =========================================
   FUNGSI BANTU
========================================= */

function getToday() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDate(value) {
  if (!value) return '-'

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split('-')

  return `${day}/${month}/${year}`
}

function formatNominal(value) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function buildMonthOptions() {
  const currentYear = new Date().getFullYear()
  const options = []

  for (
    let year = currentYear - 2;
    year <= currentYear + 2;
    year++
  ) {
    MONTH_NAMES.forEach((name, index) => {
      options.push({
        value: `${year}-${String(index + 1).padStart(2, '0')}`,
        label: `${name} ${year}`,
      })
    })
  }

  return options
}

function getCategories(result) {
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

function getCategoryId(item) {
  return item.kategori_id ?? item.category_id ?? item.id
}

function getCategoryName(item) {
  return item.nama_kategori ?? item.nama ?? item.name ?? ''
}

function getEmptyMessage(filter, searching) {
  if (searching) return 'pengingat tidak ditemukan'
  if (filter === 'terlewat') return 'tidak ada pengingat yang terlewat'
  if (filter === 'selesai') return 'belum ada pengingat yang selesai'

  // "semua" dan "terdekat" memakai teks yang sama seperti di desain (skenario 7)
  return 'tidak ada pengingat dalam waktu terdekat'
}

/* =========================================
   IKON
========================================= */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function BellIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4M5 5 7 3M19 3l2 2" />
    </svg>
  )
}

function PlusSquareIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="10.8" cy="10.8" r="7" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg {...iconProps}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg {...iconProps}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function MonthIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M10.3 13.3 12 12.2v5" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.8 2.8L16.2 9.4" />
    </svg>
  )
}

function CalendarCheckIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="m8.8 15 2.2 2.2 4.2-4.2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function renderSidebarIcon(id) {
  if (id === 'dashboard') {
    return (
      <svg {...iconProps}>
        <circle cx="7" cy="7" r="3" />
        <circle cx="17" cy="7" r="3" />
        <circle cx="7" cy="17" r="3" />
        <circle cx="17" cy="17" r="3" />
      </svg>
    )
  }

  if (id === 'transaksi') {
    return (
      <svg {...iconProps}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
        <path d="M12 7v10M7 12h10" />
      </svg>
    )
  }

  if (id === 'riwayat') {
    return (
      <svg {...iconProps}>
        <path d="M6 3h9l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M15 3v5h5" />
      </svg>
    )
  }

  return <BellIcon />
}

/* =========================================
   BADGE KATEGORI
========================================= */

function CategoryBadge({ name }) {
  const badge =
    CATEGORY_BADGES[String(name || '').trim().toLowerCase()]

  if (badge) {
    return (
      <img
        className="reminder-badge-image"
        src={badge}
        alt={name}
      />
    )
  }

  return (
    <span className="reminder-badge-text">
      {name || '-'}
    </span>
  )
}

/* =========================================
   MODAL KONFIRMASI (hapus / tandai selesai)
========================================= */

function ConfirmModal({
  variant,
  title,
  message,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape' && !busy) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [busy, onCancel])

  return (
    <div
      className="reminder-overlay"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        className="reminder-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="reminder-modal-close"
          aria-label="Tutup"
          onClick={onCancel}
          disabled={busy}
        >
          <CloseIcon />
        </button>

        <span className={`reminder-confirm-icon ${variant}`}>
          {variant === 'danger' ? (
            <img src={DeleteImage} alt="" />
          ) : (
            <CalendarCheckIcon />
          )}
        </span>

        <h2 id="reminder-confirm-title">{title}</h2>

        <p>{message}</p>

        <div className="reminder-confirm-buttons">
          <button
            type="button"
            className="reminder-btn-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            Batal
          </button>

          <button
            type="button"
            className={`reminder-btn-confirm ${variant}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================
   HALAMAN PENGINGAT
========================================= */

function RemindersPage({ user, onLogout, onNavigate }) {
  const [reminders, setReminders] = useState([])
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [categories, setCategories] = useState([])

  const [selectedMonth, setSelectedMonth] = useState('')
  const [activeFilter, setActiveFilter] = useState('semua')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  const [confirmTarget, setConfirmTarget] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const monthOptions = useMemo(() => buildMonthOptions(), [])

  const activeMonth = selectedMonth || getToday().slice(0, 7)

  const username =
    user?.username || user?.nama || user?.name || 'Pengguna'

  /* NOTIFIKASI */

  function showNotice(message, type = 'danger') {
    window.clearTimeout(noticeTimer.current)

    setNotice({ message, type })

    noticeTimer.current = window.setTimeout(() => {
      setNotice(null)
    }, NOTICE_DURATION)
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(noticeTimer.current)
    }
  }, [])

  /* PENCARIAN (debounce) */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, SEARCH_DELAY)

    return () => window.clearTimeout(timer)
  }, [search])

  /* KATEGORI UNTUK FORM TAMBAH */

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const result = await getTransactionCategories()
        const rows = getCategories(result)

        if (!cancelled) {
          setCategories(
            rows
              .map((item) => ({
                id: getCategoryId(item),
                name: getCategoryName(item),
              }))
              .filter((item) => item.id != null && item.name),
          )
        }
      } catch (err) {
        console.error('Gagal mengambil kategori:', err)
      }
    }

    loadCategories()

    return () => {
      cancelled = true
    }
  }, [])

  /* DAFTAR PENGINGAT */

  useEffect(() => {
    let cancelled = false

    async function loadReminders() {
      setLoading(true)
      setError('')

      try {
        const result = await getReminders({
          bulan: activeMonth,
          tanggal: getToday(),
          filter: activeFilter,
          search: debouncedSearch,
        })

        if (cancelled) return

        setReminders(
          Array.isArray(result?.reminders) ? result.reminders : [],
        )

        setSummary({
          ...EMPTY_SUMMARY,
          ...(result?.ringkasan || {}),
        })
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          onLogout?.()
          return
        }

        setReminders([])
        setSummary(EMPTY_SUMMARY)
        setError(err.message || 'Gagal memuat daftar pengingat.')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadReminders()

    return () => {
      cancelled = true
    }
  }, [activeMonth, activeFilter, debouncedSearch, refreshKey, onLogout])

  /* URUTAN: yang terlewat di bagian bawah (sesuai desain), lalu per tanggal */

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const overdueDifference =
        Number(Boolean(a.terlewat)) - Number(Boolean(b.terlewat))

      if (overdueDifference !== 0) {
        return overdueDifference
      }

      return String(a.tanggal).localeCompare(String(b.tanggal))
    })
  }, [reminders])

  /* KONFIRMASI HAPUS / SELESAI */

  function closeConfirm() {
    if (!actionBusy) {
      setConfirmTarget(null)
    }
  }

  async function handleConfirm() {
    if (!confirmTarget) return

    const { type, item } = confirmTarget

    setActionBusy(true)

    try {
      if (type === 'delete') {
        await deleteReminder(item.pengingat_id)

        showNotice(
          'baris pengingat yang dipilih berhasil dihapus',
          'danger',
        )
      } else {
        await completeReminder(item.pengingat_id)

        showNotice(
          'pengingat berhasil ditandai selesai',
          'success',
        )
      }

      setConfirmTarget(null)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      if (err.status === 401) {
        onLogout?.()
        return
      }

      // Data sudah berubah di server (dihapus / sudah selesai) -> segarkan tabel
      if (err.status === 404 || err.status === 409) {
        setConfirmTarget(null)
        setRefreshKey((key) => key + 1)
      }

      showNotice(err.message || 'Aksi gagal dilakukan.', 'danger')
    } finally {
      setActionBusy(false)
    }
  }

  /* TAMBAH PENGINGAT */

  function openForm() {
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    if (!saving) {
      setShowForm(false)
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleAddReminder(event) {
    event.preventDefault()

    if (
      !form.deskripsi.trim() ||
      !form.kategori_id ||
      !form.jumlah ||
      !form.tanggal
    ) {
      setFormError('Lengkapi seluruh data pengingat.')
      return
    }

    if (Number(form.jumlah) <= 0) {
      setFormError('Nominal harus lebih dari 0.')
      return
    }

    if (form.deskripsi.trim().length > 200) {
      setFormError('Deskripsi maksimal 200 karakter.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      await createReminder({
        deskripsi: form.deskripsi.trim(),
        kategori_id: Number(form.kategori_id),
        jumlah: Number(form.jumlah),
        tanggal: form.tanggal,
      })

      setShowForm(false)
      showNotice('pengingat berhasil disimpan', 'success')

      const newMonth = form.tanggal.slice(0, 7)

      if (newMonth !== activeMonth) {
        setSelectedMonth(newMonth)
      }

      setActiveFilter('semua')
      setSearch('')
      setDebouncedSearch('')
      setRefreshKey((key) => key + 1)
    } catch (err) {
      if (err.status === 401) {
        onLogout?.()
        return
      }

      setFormError(err.message || 'Gagal menyimpan pengingat.')
    } finally {
      setSaving(false)
    }
  }

  /* TAMPILAN */

  const isSearching = Boolean(debouncedSearch.trim())

  const showEmpty =
    !error && !loading && sortedReminders.length === 0

  const showLoadingMessage =
    !error && loading && sortedReminders.length === 0

  return (
    <div className="dashboard-layout reminder-layout">

      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <img src={Logo} alt="FiNote" />
        </div>

        <nav className="dashboard-navigation">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dashboard-menu-item ${
                item.id === 'pengingat' ? 'active' : ''
              }`}
              onClick={() => onNavigate?.(item.id)}
            >
              <span className="dashboard-menu-icon">
                {renderSidebarIcon(item.id)}
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
              <span className="dashboard-user-name">
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
            keluar
          </button>
        </div>
      </aside>

      {/* AREA KERJA */}

      <div className="reminder-workspace">

        {/* HEADER */}

        <header className="reminder-header">
          <div className="reminder-header-left">
            <span className="reminder-header-icon">
              <BellIcon />
            </span>

            <div className="reminder-heading">
              <h1>Halaman pengingat transaksi</h1>
              <p>buat pengingat untuk pengeluaranmu kedepan</p>
            </div>
          </div>

          <button
            className="reminder-add-button"
            type="button"
            onClick={openForm}
            disabled={saving}
          >
            <PlusSquareIcon />
            tambah pengingat
          </button>
        </header>

        {/* NOTIFIKASI */}

        {notice && (
          <div
            className={`reminder-notice ${notice.type}`}
            role="status"
            aria-live="polite"
          >
            {notice.message}
          </div>
        )}

        <main className="reminder-main">
          <section className="reminder-content">

            {/* KARTU RINGKASAN */}

            <div className="reminder-summary">
              {SUMMARY_CARDS.map((card) => {
                const count = Number(summary[card.key]) || 0

                return (
                  <button
                    key={card.key}
                    type="button"
                    className={`reminder-summary-card ${card.tone}`}
                    onClick={() => setActiveFilter(card.filter)}
                    aria-label={`${card.title}: ${count}`}
                  >
                    <div className="reminder-summary-body">
                      <div className="reminder-summary-top">
                        <img src={card.icon} alt="" />

                        <strong className={count === 0 ? 'zero' : ''}>
                          {count}
                        </strong>
                      </div>

                      <h3>{card.title}</h3>
                      <p>{card.note}</p>
                    </div>

                    <span className="reminder-summary-arrow">
                      <ChevronRight />
                    </span>
                  </button>
                )
              })}
            </div>

            {/* PENCARIAN, BULAN, FILTER */}

            <div className="reminder-toolbar">
              <div className="reminder-toolbar-left">

                <label className="reminder-search">
                  <SearchIcon />

                  <input
                    type="text"
                    placeholder="cari pengingat..."
                    value={search}
                    maxLength={100}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Cari pengingat"
                  />
                </label>

                <label className="reminder-month">
                  <span className="reminder-month-icon">
                    <MonthIcon />
                  </span>

                  <select
                    value={selectedMonth}
                    onChange={(event) =>
                      setSelectedMonth(event.target.value)
                    }
                    aria-label="Pilih bulan pengingat"
                  >
                    <option value="">Pilih bulan...</option>

                    {monthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <span className="reminder-month-arrow">
                    <ChevronDown />
                  </span>
                </label>

              </div>

              <div
                className="reminder-filters"
                role="group"
                aria-label="Filter status pengingat"
              >
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={
                      activeFilter === filter.id ? 'selected' : ''
                    }
                    onClick={() => setActiveFilter(filter.id)}
                    aria-pressed={activeFilter === filter.id}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TABEL */}

            <div
              className={`reminder-table-wrapper ${
                loading ? 'is-loading' : ''
              }`}
            >
              <table className="reminder-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Deskripsi</th>
                    <th>kategori</th>
                    <th>nominal</th>
                    <th>aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedReminders.map((item) => {
                    const isDone = item.status === 'selesai'

                    const blocked =
                      !isDone &&
                      BLOCK_OVERDUE_COMPLETE &&
                      Boolean(item.terlewat)

                    return (
                      <tr key={item.pengingat_id}>
                        <td>{formatDate(item.tanggal)}</td>

                        <td className="reminder-description">
                          {item.deskripsi}
                        </td>

                        <td>
                          <CategoryBadge name={item.nama_kategori} />
                        </td>

                        <td>{formatNominal(item.jumlah)}</td>

                        <td>
                          <div className="reminder-actions">

                            <button
                              type="button"
                              className={`reminder-done-button ${
                                isDone ? 'is-done' : ''
                              }`}
                              disabled={isDone || blocked}
                              aria-label={
                                isDone
                                  ? `${item.deskripsi} sudah selesai`
                                  : `Tandai selesai ${item.deskripsi}`
                              }
                              onClick={() =>
                                setConfirmTarget({
                                  type: 'complete',
                                  item,
                                })
                              }
                            >
                              <CheckCircleIcon />
                              selesai
                            </button>

                            <button
                              type="button"
                              className="reminder-delete-button"
                              aria-label={`Hapus pengingat ${item.deskripsi}`}
                              onClick={() =>
                                setConfirmTarget({
                                  type: 'delete',
                                  item,
                                })
                              }
                            >
                              <img src={DeleteImage} alt="" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {error && (
                <div className="reminder-empty error">{error}</div>
              )}

              {showLoadingMessage && (
                <div className="reminder-empty">
                  memuat daftar pengingat...
                </div>
              )}

              {showEmpty && (
                <div className="reminder-empty">
                  {getEmptyMessage(activeFilter, isSearching)}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* MODAL KONFIRMASI */}

      {confirmTarget && (
        <ConfirmModal
          variant={
            confirmTarget.type === 'delete' ? 'danger' : 'success'
          }
          title={
            confirmTarget.type === 'delete'
              ? 'Hapus pengingat'
              : 'Tandai selesai'
          }
          message={
            confirmTarget.type === 'delete'
              ? 'tindakan menghapus tidak dapat dikembalikan, apakah anda yakin.'
              : 'apakah anda yakin telah selesai melakukan pengeluaran tersebut'
          }
          confirmLabel={
            confirmTarget.type === 'delete' ? 'Hapus' : 'selesai'
          }
          busy={actionBusy}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
        />
      )}

      {/* MODAL TAMBAH PENGINGAT */}

      {showForm && (
        <div className="reminder-overlay" onClick={closeForm}>
          <div
            className="reminder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reminder-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reminder-modal-header">
              <h2 id="reminder-form-title">Tambah pengingat</h2>

              <button
                type="button"
                aria-label="Tutup"
                onClick={closeForm}
                disabled={saving}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddReminder}>

              <label>
                Deskripsi pengingat
                <input
                  name="deskripsi"
                  type="text"
                  maxLength={200}
                  placeholder="Contoh: Bayar listrik"
                  value={form.deskripsi}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Kategori
                <select
                  name="kategori_id"
                  value={form.kategori_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Pilih kategori</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Nominal
                <input
                  name="jumlah"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Masukkan nominal"
                  value={form.jumlah}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Tanggal pengingat
                <input
                  name="tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={handleFormChange}
                  required
                />
              </label>

              {formError && (
                <p className="reminder-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="reminder-modal-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default RemindersPage