import { useEffect, useState } from 'react'
import BellRinging from '../../assets/dashboard-assets/BellRinging.png'
import CalendarDots from '../../assets/dashboard-assets/CalendarDots.png'
import {
  getDashboardSummary,
  getDashboardCategorySummary,
} from '../../api/dashboard.api'
import { formatRupiah } from '../../utils/format'
import AppLayout from '../../components/layout/AppLayout'
import DashboardSkeleton from './DashboardSkeleton'
import './DashboardPage.css'

// 6 kategori yang ditampilkan pada grafik.
const KATEGORI_GRAFIK = [
  'Makanan',
  'Transportasi',
  'Belanja',
  'Tagihan',
  'Hiburan',
  'Lainnya',
]

function DashboardPage({ user, onLogout, onNavigate }) {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        await new Promise((r) => setTimeout(r, 500)) 
        // boleh dihapus atau tidak

        const [summaryData, categoryData] = await Promise.all([
          getDashboardSummary(),
          getDashboardCategorySummary(),
        ])

        if (cancelled) return

        setSummary(summaryData)
        setCategories(
          Array.isArray(categoryData?.categories)
            ? categoryData.categories
            : [],
        )
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          onLogout()
          return
        }

        setError(
          err.message || 'Data dashboard gagal dimuat.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [onLogout])

  const totalHari =
    summary?.total_pengeluaran_hari_ini ?? 0

  const totalBulan =
    summary?.total_pengeluaran_bulan_ini ?? 0

  const belumAdaCatatan =
    !loading &&
    !error &&
    totalHari === 0 &&
    totalBulan === 0

  const tampil = (nilai) => {
    if (error) return '-'
    return formatRupiah(nilai)
  }


  // Grafik selalu menampilkan 6 kategori (termasuk "Lainnya").
  // Nilainya diambil dari API; jika data belum ada, nilainya 0.
  const kategoriGrafik = KATEGORI_GRAFIK.map((nama) => {
    const data = categories.find(
      (item) =>
        String(item.nama_kategori).trim().toLowerCase() ===
        nama.toLowerCase(),
    )

    return {
      kategori_id: data?.kategori_id ?? nama,
      nama_kategori: data?.nama_kategori ?? nama,
      total: Number(data?.total) || 0,
    }
  })

  const nilaiTerbesar = Math.max(
    1,
    ...kategoriGrafik.map((item) => Number(item.total) || 0),
  )

  return (
    <AppLayout
      activePage="dashboard"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="app-workspace">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <span className="dashboard-header-calendar">
              <img src={CalendarDots} alt="" />
            </span>

            <div className="dashboard-heading">
              <h1>Halo, sahabat Finote !</h1>
              <p>
                Pantau uang keluar kamu dengan mudah hari ini.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-notification"
            aria-label="Buka pengingat"
            title="Pengingat"
            onClick={() => onNavigate?.('pengingat')}
          >
            <img src={BellRinging} alt="" />
          </button>
        </header>

        <main className="dashboard-main">
          {error && (
            <div
              className="dashboard-error-message"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
          <section
            className="dashboard-summary"
            aria-label="Ringkasan pengeluaran"
          >
            <article className="dashboard-summary-card">
              <h2>Pengeluaran hari ini</h2>
              <p className="dashboard-summary-value">
                {tampil(totalHari)}
              </p>
            </article>

            <article className="dashboard-summary-card">
              <h2>Pengeluaran bulan ini</h2>
              <p className="dashboard-summary-value">
                {tampil(totalBulan)}
              </p>
            </article>
          </section>

          {belumAdaCatatan && (
            <div
              className="dashboard-empty-message"
              role="status"
            >
              Silakan klik “Transaksi” untuk mencatat pengeluaranmu.
            </div>
          )}

          <section
            className="dashboard-chart-card"
            aria-label="Grafik pengeluaran berdasarkan kategori"
          >
            <div className="dashboard-chart-heading">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <rect x="5" y="12" width="4" height="9" />
                <rect x="10" y="7" width="4" height="14" />
                <rect x="15" y="3" width="4" height="18" />
              </svg>

              <h2>Grafik Pengeluaran berdasarkan kategori</h2>
            </div>

            <div className="dashboard-chart-divider" />

            <div className="dashboard-chart">
              {kategoriGrafik.map((category) => {
                const total = category.total
                const tinggi =
                  total > 0
                    ? Math.max((total / nilaiTerbesar) * 100, 15)
                    : 0

                const tertinggi =
                  total > 0 && total === nilaiTerbesar

                return (
                  <div
                    className={`dashboard-chart-column ${
                      tertinggi ? 'highest' : ''
                    }`}
                    key={category.kategori_id}
                  >
                    <span className="dashboard-chart-value">
                      {total > 0
                        ? new Intl.NumberFormat('id-ID').format(total)
                        : ''}
                    </span>

                    <div className="dashboard-chart-bar-area">
                      <div
                        className="dashboard-chart-bar"
                        style={{ height: `${tinggi}%` }}
                        title={`${category.nama_kategori}: ${formatRupiah(total)}`}
                      />
                    </div>

                    <span className="dashboard-chart-label">
                      {category.nama_kategori}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="dashboard-chart-baseline" />

            <div className="dashboard-chart-legend">
              <span className="dashboard-legend-dot" />
              <span>Tertinggi</span>
            </div>
          </section>
            </>
          )}
        </main>
      </div>
    </AppLayout>
  )
}

export default DashboardPage