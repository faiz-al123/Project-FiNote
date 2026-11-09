
import { useEffect, useMemo, useState } from 'react'

import Logo from '../../assets/Logo.png'
import ProfileIcon from '../../assets/dashboard-assets/ikon profile.png'

import RedCalendar from '../../assets/pengingat-assets/RedCalender.png'
import GreenCalendar from '../../assets/pengingat-assets/GreenCalender.png'
import BlueCalendar from '../../assets/pengingat-assets/BlueCalender.png'
import PinkCalendar from '../../assets/pengingat-assets/PinkCalender.png'

import { getReminders } from '../../api/reminder.api'
import { getTransactionCategories } from '../../api/transaction.api'
import { formatRupiah } from '../../utils/format'

import './RemindersPage.css'
import '../dashboard/DashboardPage.css'

function getToday() {
  const date = new Date()

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDate(value) {
  if (!value) return '-'

  const [year, month, day] = String(value).slice(0, 10).split('-')

  return `${day}-${month}-${year}`
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
  return (
    item.nama_kategori ??
    item.nama ??
    item.name ??
    ''
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4M5 5 7 3M19 3l2 2" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.8" cy="10.8" r="7" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ReminderPageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  )
}

function RemindersPage({ user, onLogout, onNavigate }) {
  const [reminders, setReminders] = useState([])
  const [summary, setSummary] = useState({
    terdekat: 0,
    total: 0,
    selesai: 0,
    terlewat: 0,
  })

  const [categories, setCategories] = useState([])

  const [selectedMonth, setSelectedMonth] = useState(
    getToday().slice(0, 7),
  )

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('semua')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    deskripsi: '',
    kategori_id: '',
    jumlah: '',
    tanggal: '',
  })

  // Data sementara untuk interaksi frontend.
  const [localReminders, setLocalReminders] = useState([])

  const username =
    user?.username ||
    user?.nama ||
    user?.name ||
    'Pengguna'

  // Mengambil kategori.
  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const result = await getTransactionCategories()
        const rows = getCategories(result)

        if (!cancelled) {
          setCategories(
            rows.map((item) => ({
              id: getCategoryId(item),
              name: getCategoryName(item),
            })).filter((item) => item.id != null && item.name),
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

  // Mengambil daftar pengingat berdasarkan bulan dan filter.
  useEffect(() => {
    let cancelled = false

    async function loadReminders() {
      setLoading(true)
      setError('')

      try {
        const result = await getReminders({
          bulan: selectedMonth,
          tanggal: getToday(),
          filter: activeFilter,
          search,
        })

        if (cancelled) return

        setReminders(
          Array.isArray(result?.reminders)
            ? result.reminders
            : [],
        )

        setSummary(
          result?.ringkasan || {
            terdekat: 0,
            total: 0,
            selesai: 0,
            terlewat: 0,
          },
        )
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          onLogout?.()
          return
        }

        setError(
          err.message || 'Gagal memuat daftar pengingat.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReminders()

    return () => {
      cancelled = true
    }
  }, [selectedMonth, activeFilter, search, onLogout])

  // Menggabungkan data server dengan data sementara frontend.
  const displayedReminders = useMemo(() => {
    return [...localReminders, ...reminders]
      .filter((item) => {
        if (activeFilter === 'selesai') {
          return item.status === 'selesai'
        }

        if (activeFilter === 'terlewat') {
          return item.terlewat
        }

        if (activeFilter === 'terdekat') {
          return item.terdekat
        }

        return true
      })
      .sort((a, b) =>
        String(a.tanggal).localeCompare(String(b.tanggal)),
      )
  }, [localReminders, reminders, activeFilter])

  // Statistik tampilan.
  const displayedSummary = useMemo(() => {
    const local = localReminders.filter((item) =>
      String(item.tanggal).startsWith(selectedMonth),
    )

    return {
      terdekat:
        Number(summary.terdekat) +
        local.filter((item) => item.terdekat).length,

      total:
        Number(summary.total) + local.length,

      selesai:
        Number(summary.selesai) +
        local.filter((item) => item.status === 'selesai').length,

      terlewat:
        Number(summary.terlewat) +
        local.filter((item) => item.terlewat).length,
    }
  }, [summary, localReminders, selectedMonth])

  function showNotice(message) {
    setNotice(message)

    window.setTimeout(() => {
      setNotice('')
    }, 3000)
  }

  function handleFormChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Tambah data sementara pada frontend.
  function handleAddReminder(event) {
    event.preventDefault()

    if (
      !form.deskripsi.trim() ||
      !form.kategori_id ||
      !form.jumlah ||
      !form.tanggal
    ) {
      showNotice('Lengkapi seluruh data pengingat.')
      return
    }

    if (Number(form.jumlah) <= 0) {
      showNotice('Nominal harus lebih dari 0.')
      return
    }

    const category = categories.find(
      (item) => String(item.id) === String(form.kategori_id),
    )

    const reminder = {
      pengingat_id: `local-${Date.now()}`,
      deskripsi: form.deskripsi.trim(),
      kategori_id: form.kategori_id,
      nama_kategori: category?.name || '-',
      jumlah: Number(form.jumlah),
      tanggal: form.tanggal,
      status: 'belum_selesai',
      terlewat: form.tanggal < getToday(),
      terdekat:
        form.tanggal >= getToday() &&
        form.tanggal < (() => {
          const date = new Date(`${getToday()}T00:00:00`)
          date.setDate(date.getDate() + 3)
          return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
          ].join('-')
        })(),
    }

    setLocalReminders((previous) => [
      ...previous,
      reminder,
    ])

    setForm({
      deskripsi: '',
      kategori_id: '',
      jumlah: '',
      tanggal: '',
    })

    setShowModal(false)
    showNotice('Pengingat berhasil ditambahkan sementara.')
  }

  // Menandai selesai secara lokal.
  function handleComplete(id) {
    setLocalReminders((previous) =>
      previous.map((item) =>
        item.pengingat_id === id
          ? {
              ...item,
              status: 'selesai',
              selesai_pada: getToday(),
              terdekat: false,
              terlewat: false,
            }
          : item,
      ),
    )

    showNotice('Status pengingat lokal berhasil diperbarui.')
  }

  // Menghapus data secara lokal.
  function handleDelete(id) {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus pengingat ini?',
    )

    if (!confirmed) return

    setLocalReminders((previous) =>
      previous.filter((item) => item.pengingat_id !== id),
    )

    showNotice('Pengingat lokal berhasil dihapus.')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transaksi', label: 'Transaksi' },
    { id: 'riwayat', label: 'Riwayat' },
    { id: 'pengingat', label: 'pengingat' },
  ]

  function renderSidebarIcon(id) {
    const props = {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }

    if (id === 'dashboard') {
      return (
        <svg {...props}>
          <circle cx="7" cy="7" r="3" />
          <circle cx="17" cy="7" r="3" />
          <circle cx="7" cy="17" r="3" />
          <circle cx="17" cy="17" r="3" />
        </svg>
      )
    }

    if (id === 'transaksi') {
      return (
        <svg {...props}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
          <path d="M12 7v10M7 12h10" />
        </svg>
      )
    }

    if (id === 'riwayat') {
      return (
        <svg {...props}>
          <path d="M6 3h9l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M15 3v5h5" />
        </svg>
      )
    }

    return <ReminderPageIcon />
  }

  return (
    <div className="dashboard-layout reminder-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <img src={Logo} alt="FiNote" />
        </div>

        <nav className="dashboard-navigation">
          {menuItems.map((item) => (
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
            Keluar
          </button>
        </div>
      </aside>

      {/* WORKSPACE */}
      <div className="reminder-workspace">

        {/* HEADER */}
        <header className="reminder-header">
          <div className="reminder-header-title">
            <span className="reminder-header-icon">
              <BellIcon />
            </span>

            <div>
              <h1>Halaman pengingat transaksi</h1>
              <p>
                buat pengingat untuk pengeluaranmu kedepan
              </p>
            </div>
          </div>

          <button
            className="reminder-add-button"
            type="button"
            onClick={() => setShowModal(true)}
          >
            <PlusIcon />
            tambah pengingat
          </button>
        </header>

        <main className="reminder-main">
          <section className="reminder-content">

            {/* SUMMARY */}
            <div className="reminder-summary">

              <div className="reminder-summary-card nearest">
                <img src={RedCalendar} alt="" />

                <div>
                  <strong>{displayedSummary.terdekat}</strong>
                  <h3>Terdekat</h3>
                  <p>&lt; 3 hari</p>
                </div>

                <span><ChevronRight /></span>
              </div>

              <div className="reminder-summary-card total">
                <img src={GreenCalendar} alt="" />

                <div>
                  <strong>{displayedSummary.total}</strong>
                  <h3>Total satu bulan</h3>
                  <p>semua pengingat</p>
                </div>

                <span><ChevronRight /></span>
              </div>

              <div className="reminder-summary-card completed">
                <img src={BlueCalendar} alt="" />

                <div>
                  <strong>{displayedSummary.selesai}</strong>
                  <h3>Selesai</h3>
                  <p>sudah ditandai selesai</p>
                </div>

                <span><ChevronRight /></span>
              </div>

              <div className="reminder-summary-card missed">
                <img src={PinkCalendar} alt="" />

                <div>
                  <strong>{displayedSummary.terlewat}</strong>
                  <h3>Terlewat</h3>
                  <p>belum ditandai selesai</p>
                </div>

                <span><ChevronRight /></span>
              </div>
            </div>

            {/* TOOLBAR */}
            <div className="reminder-toolbar">

              <div className="reminder-toolbar-left">
                <div className="reminder-search">
                  <SearchIcon />

                  <input
                    type="text"
                    placeholder="cari pengingat..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />
                </div>

                <input
                  className="reminder-month"
                  type="month"
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(event.target.value)
                  }
                  aria-label="Pilih bulan pengingat"
                />
              </div>

              <div className="reminder-filters">
                {[
                  { id: 'semua', label: 'semua' },
                  { id: 'terdekat', label: 'terdekat' },
                  { id: 'terlewat', label: 'terlewat' },
                  { id: 'selesai', label: 'selesai' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={
                      activeFilter === filter.id ? 'selected' : ''
                    }
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE */}
            <div className="reminder-table-wrapper">
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
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="reminder-message">
                        Memuat daftar pengingat...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" className="reminder-message error">
                        {error}
                      </td>
                    </tr>
                  ) : displayedReminders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="reminder-message">
                        {activeFilter === 'terdekat'
                          ? 'Tidak ada pengingat dalam waktu terdekat.'
                          : 'Belum ada pengingat pada bulan ini.'}
                      </td>
                    </tr>
                  ) : (
                    displayedReminders.map((item) => (
                      <tr key={item.pengingat_id}>
                        <td>{formatDate(item.tanggal)}</td>

                        <td>{item.deskripsi}</td>

                        <td>{item.nama_kategori || '-'}</td>

                        <td>
                          {formatRupiah(item.jumlah || 0)}
                        </td>

                        <td>
                          <div className="reminder-actions">
                            {item.status !== 'selesai' && (
                              <button
                                type="button"
                                className="complete-action"
                                title="Tandai selesai"
                                onClick={() =>
                                  handleComplete(item.pengingat_id)
                                }
                              >
                                ✓
                              </button>
                            )}

                            <button
                              type="button"
                              className="delete-action"
                              title="Hapus pengingat"
                              onClick={() =>
                                handleDelete(item.pengingat_id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="reminder-footnote">
              Data pengingat yang berasal dari server ditampilkan
              berdasarkan bulan dan filter yang dipilih.
            </p>
          </section>
        </main>
      </div>

      {/* MODAL TAMBAH PENGINGAT */}
      {showModal && (
        <div
          className="reminder-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="reminder-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reminder-modal-header">
              <h2>Tambah pengingat</h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddReminder}>
              <label>
                Deskripsi pengingat
                <input
                  name="deskripsi"
                  type="text"
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
                    <option
                      key={category.id}
                      value={category.id}
                    >
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

              <div className="reminder-modal-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notice && (
        <div className="reminder-toast">
          {notice}
        </div>
      )}
    </div>
  )
}

export default RemindersPage
