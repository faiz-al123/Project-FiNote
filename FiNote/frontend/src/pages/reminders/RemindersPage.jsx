import { useEffect, useMemo, useRef, useState } from 'react'


import DeleteImage from '../../assets/pengingat-assets/Delete.png'
import ReminderBellImage from '../../assets/pengingat-assets/Bell.png'

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
  updateReminder,
  completeReminder,
  deleteReminder,
} from '../../api/reminder.api'

import { getTransactionCategories } from '../../api/transaction.api'

import AppLayout from '../../components/layout/AppLayout'
import { ReminderCountSkeleton, ReminderTableSkeleton } from './ReminderSkeleton'
import './RemindersPage.css'

const NOTICE_DURATION = 3500
const SEARCH_DELAY = 350
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
  { key: 'terdekat', filter: 'terdekat', tone: 'nearest', icon: RedCalendar, title: 'Terdekat', note: '< 3 hari' },
  { key: 'total', filter: 'semua', tone: 'total', icon: BlueCalendar, title: 'Total satu bulan', note: 'semua pengingat' },
  { key: 'selesai', filter: 'selesai', tone: 'completed', icon: GreenCalendar, title: 'Selesai', note: 'sudah ditandai selesai' },
  { key: 'terlewat', filter: 'terlewat', tone: 'missed', icon: OrangeCalendar, title: 'Terlewat', note: 'belum ditandai selesai' },
]

const CATEGORY_BADGES = {
  tagihan: BadgeTagihan,
  makanan: BadgeMakanan,
  belanja: BadgeBelanja,
  hiburan: BadgeHiburan,
  transportasi: BadgeTransportasi,
}

/* =========================================
   FUNGSI BANTU
========================================= */

function getToday() {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

function formatNominal(value) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

// Fungsi untuk merapikan input nominal (hanya angka)
function formatNumberInput(value) {
  const text = String(value)
  // Biarkan karakter selain angka tetap terlihat agar validasi dapat mendeteksinya.
  if (text && !/^[\d.]+$/.test(text)) return text
  const number = text.replace(/[^\d]/g, '')
  if (!number) return ''
  return new Intl.NumberFormat('id-ID').format(Number(number))
}

// Fungsi untuk mengambil angka murni dari string berformat (misal "10.000" jadi 10000)
function parseRawNumber(value) {
  return Number(String(value).replace(/[^\d]/g, ''))
}

// Mengisi form edit dengan data pengingat yang dipilih
function buildEditForm(item) {
  return {
    tanggal: String(item.tanggal || '').slice(0, 10),
    deskripsi: item.deskripsi || '',
    kategori_id: item.kategori_id != null ? String(item.kategori_id) : '',
    jumlah: formatNumberInput(String(Math.round(Number(item.jumlah) || 0))),
  }
}

function buildMonthOptions() {
  const currentYear = new Date().getFullYear()
  const options = []
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
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
  const candidates = [result?.data?.categories, result?.data?.kategori, result?.data?.kategoris, result?.categories, result?.kategori, result?.data]
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
  return 'tidak ada pengingat dalam waktu terdekat'
}

/* =========================================
   IKON
========================================= */

const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

function BellIcon() { return <svg {...iconProps}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4M5 5 7 3M19 3l2 2" /></svg> }
function PlusIcon() { return <svg {...iconProps}><path d="M12 4v16M4 12h16" /></svg> }
function ResetIcon() { return <svg {...iconProps}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg> }
function EditIcon() { return <svg {...iconProps}><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.6 8 15.6l1-4 9.4-9Z" /></svg> }
function SearchIcon() { return <svg {...iconProps}><circle cx="10.8" cy="10.8" r="7" /><path d="m16 16 5 5" /></svg> }
function ChevronRight() { return <svg {...iconProps}><path d="m9 18 6-6-6-6" /></svg> }
function ChevronDown() { return <svg {...iconProps}><path d="m6 9 6 6 6-6" /></svg> }
function MonthIcon() { return <svg {...iconProps}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="M10.3 13.3 12 12.2v5" /></svg> }
function CheckCircleIcon() { return <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.8 2.8L16.2 9.4" /></svg> }
function CalendarCheckIcon() { return <svg {...iconProps}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="m8.8 15 2.2 2.2 4.2-4.2" /></svg> }
function CloseIcon() { return <svg {...iconProps}><path d="M6 6l12 12M18 6 6 18" /></svg> }

function FormCalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  )
}

/* =========================================
   BADGE KATEGORI & MODAL
========================================= */

function CategoryBadge({ name }) {
  const badge = CATEGORY_BADGES[String(name || '').trim().toLowerCase()]
  if (badge) return <img className="reminder-badge-image" src={badge} alt={name} />
  return <span className="reminder-badge-text">{name || '-'}</span>
}

function ConfirmModal({ variant, title, message, confirmLabel, busy, onCancel, onConfirm }) {
  useEffect(() => {
    function handleKey(event) { if (event.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [busy, onCancel])

  return (
    <div className="reminder-overlay" onClick={() => { if (!busy) onCancel() }}>
      <div className="reminder-confirm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="reminder-modal-close" aria-label="Tutup" onClick={onCancel} disabled={busy}><CloseIcon /></button>
        <span className={`reminder-confirm-icon ${variant}`}>
          {variant === 'danger' ? <img src={DeleteImage} alt="" /> : <CalendarCheckIcon />}
        </span>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="reminder-confirm-buttons">
          <button type="button" className="reminder-btn-cancel" onClick={onCancel} disabled={busy}>Batal</button>
          <button type="button" className={`reminder-btn-confirm ${variant}`} onClick={onConfirm} disabled={busy}>
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
  // Menandai apakah data pertama sudah selesai dimuat
  const [hasLoaded, setHasLoaded] = useState(false)
  const hasLoadedRef = useRef(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  // Pengingat yang sedang diedit (null = form buat pengingat baru)
  const [editTarget, setEditTarget] = useState(null)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const datePickerRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const monthOptions = useMemo(() => buildMonthOptions(), [])
  const activeMonth = selectedMonth || getToday().slice(0, 7)

  function showNotice(message, type = 'danger') {
    window.clearTimeout(noticeTimer.current)
    setNotice({ message, type })
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_DURATION)
  }

  useEffect(() => {
    return () => window.clearTimeout(noticeTimer.current)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      try {
        const result = await getTransactionCategories()
        const rows = getCategories(result)
        if (!cancelled) {
          setCategories(
            rows.map((item) => ({ id: getCategoryId(item), name: getCategoryName(item) }))
                .filter((item) => item.id != null && item.name)
          )
        }
      } catch (err) {
        console.error('Gagal mengambil kategori:', err)
      }
    }
    loadCategories()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadReminders() {
      setLoading(true)
      setError('')
      try {
        // Skeleton tampil minimal 500 ms, hanya pada pemuatan pertama
        // (agar pencarian dan filter berikutnya tidak diperlambat)
        const minimumLoading = hasLoadedRef.current
          ? null
          : new Promise((r) => setTimeout(r, 500))

        const [result] = await Promise.all([
          getReminders({
            bulan: activeMonth,
            tanggal: getToday(),
            filter: activeFilter,
            search: debouncedSearch,
          }),
          minimumLoading,
        ])
        if (cancelled) return
        setReminders(Array.isArray(result?.reminders) ? result.reminders : [])
        setSummary({ ...EMPTY_SUMMARY, ...(result?.ringkasan || {}) })
      } catch (err) {
        if (cancelled) return
        if (err.status === 401) { onLogout?.(); return }
        setReminders([])
        setSummary(EMPTY_SUMMARY)
        setError(err.message || 'Gagal memuat daftar pengingat.')
      } finally {
        if (!cancelled) {
          hasLoadedRef.current = true
          setHasLoaded(true)
          setLoading(false)
        }
      }
    }
    loadReminders()
    return () => { cancelled = true }
  }, [activeMonth, activeFilter, debouncedSearch, refreshKey, onLogout])

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const overdueDifference = Number(Boolean(a.terlewat)) - Number(Boolean(b.terlewat))
      if (overdueDifference !== 0) return overdueDifference
      return String(a.tanggal).localeCompare(String(b.tanggal))
    })
  }, [reminders])

  function closeConfirm() {
    if (!actionBusy) setConfirmTarget(null)
  }

  async function handleConfirm() {
    if (!confirmTarget) return
    const { type, item } = confirmTarget
    setActionBusy(true)
    try {
      if (type === 'delete') {
        await deleteReminder(item.pengingat_id)
        showNotice('baris pengingat yang dipilih berhasil dihapus', 'danger')
      } else {
        await completeReminder(item.pengingat_id)
        showNotice('pengingat berhasil ditandai selesai', 'success')
      }
      setConfirmTarget(null)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      if (err.status === 401) { onLogout?.(); return }
      if (err.status === 404 || err.status === 409) {
        setConfirmTarget(null)
        setRefreshKey((key) => key + 1)
      }
      showNotice(err.message || 'Aksi gagal dilakukan.', 'danger')
    } finally {
      setActionBusy(false)
    }
  }

  function openForm() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFieldErrors({})
    setShowForm(true)
  }

  function openEdit(item) {
    setEditTarget(item)
    setForm(buildEditForm(item))
    setFormError('')
    setFieldErrors({})
    setShowForm(true)
  }

  // Reset: form baru dikosongkan, form edit dikembalikan ke data awal
  function resetForm() {
    setForm(editTarget ? buildEditForm(editTarget) : EMPTY_FORM)
    setFormError('')
    setFieldErrors({})
  }

  function openDatePicker() {
    const picker = datePickerRef.current
    if (!picker) return
    if (typeof picker.showPicker === 'function') picker.showPicker()
    else picker.click()
  }

  function closeForm() {
    if (!saving) setShowForm(false)
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    let formattedValue = value

    // Cegah scroll mouse mengubah nominal & format otomatis pakai titik
    if (name === 'jumlah') {
      formattedValue = formatNumberInput(value)
    }

    setForm((previous) => ({
      ...previous,
      [name]: formattedValue,
    }))

    setFieldErrors((previous) => ({ ...previous, [name]: '' }))
    if (formError) setFormError('')
  }

  async function handleAddReminder(event) {
    event.preventDefault()

    const nextErrors = {
      tanggal: !form.tanggal,
      deskripsi: !form.deskripsi.trim(),
      kategori_id: !form.kategori_id,
      jumlah: !String(form.jumlah).trim(),
    }

    const FIELD_LABELS = {
      tanggal: 'Tanggal',
      deskripsi: 'Deskripsi',
      kategori_id: 'Kategori',
      jumlah: 'Nominal',
    }
    const emptyFields = Object.keys(nextErrors).filter((key) => nextErrors[key])

    if (emptyFields.length > 0) {
      setFieldErrors(nextErrors)
      // Satu kolom kosong -> sebut nama kolomnya; lebih dari satu -> pesan umum
      setFormError(
        emptyFields.length === 1
          ? `${FIELD_LABELS[emptyFields[0]]} Tidak Boleh Kosong`
          : 'Kolom Tidak Boleh Kosong',
      )
      return
    }

    // Validasi dilakukan sebelum mengambil angka murni agar input seperti "gocap"
    // tidak diam-diam berubah menjadi 0.
    if (!/^[\d.]+$/.test(String(form.jumlah).trim())) {
      setFieldErrors({ tanggal: false, deskripsi: false, kategori_id: false, jumlah: true })
      setFormError('Nominal harus berupa angka')
      return
    }

    const rawJumlah = parseRawNumber(form.jumlah)
    if (!Number.isFinite(rawJumlah) || rawJumlah <= 0) {
      setFieldErrors({ tanggal: false, deskripsi: false, kategori_id: false, jumlah: true })
      setFormError('Nominal harus lebih dari 0')
      return
    }

    if (form.deskripsi.trim().length > 200) {
      setFieldErrors({ tanggal: false, deskripsi: true, kategori_id: false, jumlah: false })
      setFormError('Deskripsi maksimal 200 karakter')
      return
    }

    setSaving(true)
    setFormError('')
    setFieldErrors({})

    const isEditing = Boolean(editTarget)

    try {
      const payload = {
        deskripsi: form.deskripsi.trim(),
        kategori_id: Number(form.kategori_id),
        jumlah: rawJumlah, // Kirim angka murni, misal 10000
        tanggal: form.tanggal,
      }

      if (isEditing) {
        await updateReminder(editTarget.pengingat_id, payload)
      } else {
        await createReminder(payload)
      }

      setShowForm(false)
      setEditTarget(null)
      showNotice(isEditing ? 'pengingat berhasil di ubah' : 'Berhasil disimpan', 'success')
      const newMonth = form.tanggal.slice(0, 7)
      if (newMonth !== activeMonth) setSelectedMonth(newMonth)
      setActiveFilter('semua')
      setSearch('')
      setDebouncedSearch('')
      setRefreshKey((key) => key + 1)
    } catch (err) {
      if (err.status === 401) { onLogout?.(); return }
      setFormError(err.message || 'Gagal menyimpan pengingat.')
    } finally {
      setSaving(false)
    }
  }

  const isSearching = Boolean(debouncedSearch.trim())
  const showEmpty = !error && !loading && sortedReminders.length === 0
  const showLoadingMessage = !error && loading && sortedReminders.length === 0

  // Form edit menampilkan badge kategori di dalam kolom kategori (sesuai desain)
  const selectedCategory = categories.find(
    (category) => String(category.id) === String(form.kategori_id),
  )
  const selectedBadge = editTarget && selectedCategory
    ? CATEGORY_BADGES[String(selectedCategory.name).trim().toLowerCase()]
    : null

  return (
    <AppLayout
      activePage="pengingat"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      className="reminder-layout"
    >

      {/* AREA KERJA */}
      <div className="reminder-workspace">
        <header className="reminder-header">
          <div className="reminder-header-left">
            <span className="reminder-header-icon"><BellIcon /></span>
            <div className="reminder-heading">
              <h1>Halaman pengingat transaksi</h1>
              <p>buat pengingat untuk pengeluaranmu kedepan</p>
            </div>
          </div>
          <button className="reminder-add-button" type="button" onClick={openForm} disabled={saving}>
            <PlusIcon /> tambah pengingat
          </button>
        </header>

        {notice && (
          <div className={`reminder-notice ${notice.type}`} role="status" aria-live="polite">
            {notice.message}
          </div>
        )}

        <main className="reminder-main">
          <section className="reminder-content">
            <div className="reminder-summary">
              {SUMMARY_CARDS.map((card) => {
                const count = Number(summary[card.key]) || 0
                return (
                  <button key={card.key} type="button" className={`reminder-summary-card ${card.tone}`} onClick={() => setActiveFilter(card.filter)}>
                    <div className="reminder-summary-body">
                      <div className="reminder-summary-top">
                        <img src={card.icon} alt="" />
                        {hasLoaded ? (
                          <strong className={count === 0 ? 'zero' : ''}>{count}</strong>
                        ) : (
                          <ReminderCountSkeleton />
                        )}
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.note}</p>
                    </div>
                    <span className="reminder-summary-arrow"><ChevronRight /></span>
                  </button>
                )
              })}
            </div>

            <div className="reminder-toolbar">
              <div className="reminder-toolbar-left">
                <label className="reminder-search">
                  <SearchIcon />
                  <input
                    type="text"
                    placeholder="cari pengingat..."
                    value={search}
                    maxLength={100}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label className="reminder-month">
                  <span className="reminder-month-icon"><MonthIcon /></span>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="">Pilih bulan...</option>
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="reminder-month-arrow"><ChevronDown /></span>
                </label>
              </div>
              <div className="reminder-filters">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={activeFilter === filter.id ? 'selected' : ''}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`reminder-table-wrapper ${loading && !showLoadingMessage ? 'is-loading' : ''}`}>
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
                  {showLoadingMessage && <ReminderTableSkeleton />}
                  {sortedReminders.map((item) => {
                    const isDone = item.status === 'selesai'
                    const blocked = !isDone && BLOCK_OVERDUE_COMPLETE && Boolean(item.terlewat)
                    return (
                      <tr key={item.pengingat_id}>
                        <td>{formatDate(item.tanggal)}</td>
                        <td className="reminder-description">{item.deskripsi}</td>
                        <td><CategoryBadge name={item.nama_kategori} /></td>
                        <td>{formatNominal(item.jumlah)}</td>
                        <td>
                          <div className="reminder-actions">
                            <button
                              type="button"
                              className={`reminder-done-button ${isDone ? 'is-done' : ''}`}
                              disabled={isDone || blocked}
                              onClick={() => setConfirmTarget({ type: 'complete', item })}
                            >
                              <CheckCircleIcon /> selesai
                            </button>
                            <button
                              type="button"
                              className="reminder-delete-button"
                              onClick={() => setConfirmTarget({ type: 'delete', item })}
                            >
                              <img src={DeleteImage} alt="" />
                            </button>
                            <button
                              type="button"
                              className="reminder-edit-button"
                              aria-label="Ubah pengingat"
                              onClick={() => openEdit(item)}
                            >
                              <EditIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {error && <div className="reminder-empty error">{error}</div>}
              {showEmpty && <div className="reminder-empty">{getEmptyMessage(activeFilter, isSearching)}</div>}
            </div>
          </section>
        </main>
      </div>

      {confirmTarget && (
        <ConfirmModal
          variant={confirmTarget.type === 'delete' ? 'danger' : 'success'}
          title={confirmTarget.type === 'delete' ? 'Hapus pengingat' : 'Tandai selesai'}
          message={confirmTarget.type === 'delete' ? 'tindakan menghapus tidak dapat dikembalikan, apakah anda yakin.' : 'apakah anda yakin telah selesai melakukan pengeluaran tersebut'}
          confirmLabel={confirmTarget.type === 'delete' ? 'Hapus' : 'selesai'}
          busy={actionBusy}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
        />
      )}

      {showForm && (
        <div className="reminder-overlay reminder-form-overlay" onClick={closeForm}>
          <div className={`reminder-modal reminder-create-modal ${editTarget ? 'reminder-edit-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="reminder-create-header">
              <div className="reminder-create-heading">
                <span className="reminder-create-icon">
                  {editTarget ? <EditIcon /> : <img src={ReminderBellImage} alt="" />}
                </span>
                <div>
                  <h2>{editTarget ? 'Edit pengingat' : 'Buat pengingat baru'}</h2>
                  <p>{editTarget ? 'edit form untuk ubah pengingat' : 'lengkapi form untuk pengingat'}</p>
                </div>
              </div>
              <button type="button" className="reminder-create-close" onClick={closeForm} disabled={saving}>
                <CloseIcon />
              </button>
            </div>

            <div className="reminder-create-divider" />

            <form className="reminder-create-form" onSubmit={handleAddReminder}>
              <label className="reminder-create-field">
                <span>tanggal<span className="required-mark">*</span></span>
                <div className={`reminder-date-input-wrapper ${fieldErrors.tanggal ? 'is-invalid' : ''}`} onClick={openDatePicker}>
                  <input
                    type="text"
                    className="reminder-date-display"
                    value={form.tanggal ? formatDate(form.tanggal) : ''}
                    placeholder="dd/mm/yyyy"
                    readOnly
                    aria-label="tanggal"
                  />
                  <button type="button" className="reminder-date-icon" onClick={(event) => { event.preventDefault(); event.stopPropagation(); openDatePicker() }} aria-label="Pilih tanggal">
                    <FormCalendarIcon />
                  </button>
                  <input
                    ref={datePickerRef}
                    name="tanggal"
                    type="date"
                    className="reminder-native-date"
                    value={form.tanggal}
                    onChange={handleFormChange}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="reminder-create-field">
                <span>Deskripsi<span className="required-mark">*</span></span>
                <input
                  className={fieldErrors.deskripsi ? 'is-invalid' : ''}
                  name="deskripsi"
                  type="text"
                  maxLength={200}
                  placeholder="nama pengeluaran"
                  value={form.deskripsi}
                  onChange={handleFormChange}
                />
              </label>

              <label className="reminder-create-field">
                <span>Kategori<span className="required-mark">*</span></span>
                <select className={`${fieldErrors.kategori_id ? 'is-invalid' : ''} ${selectedBadge ? 'has-badge' : ''}`} name="kategori_id" value={form.kategori_id} onChange={handleFormChange}>
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {selectedBadge && (
                  <img className="reminder-select-badge" src={selectedBadge} alt="" aria-hidden="true" />
                )}
              </label>

              <label className="reminder-create-field">
                <span>Nominal<span className="required-mark">*</span></span>
                <div className={`reminder-nominal-input ${fieldErrors.jumlah ? 'is-invalid' : ''}`}>
                  <span>Rp</span>
                  <input
                    name="jumlah"
                    type="text"
                    inputMode="numeric"
                    placeholder="10.000"
                    value={form.jumlah}
                    onChange={handleFormChange}
                  />
                </div>
              </label>

              {formError && (
                <p className="reminder-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="reminder-create-buttons">
                <button type="button" className="reminder-create-cancel" onClick={resetForm} disabled={saving}><ResetIcon /> Reset</button>
                <button type="submit" className="reminder-create-save" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default RemindersPage