import { useEffect, useState } from 'react'

import HeaderImg from '../../assets1/dashboardassets/Overlay.png'
import ChartTitleImg from '../../assets1/dashboardassets/card_header.png'
import HighestTitleImg from '../../assets1/dashboardassets/kategori_tertinggi.png'

import IconHariIni from '../../assets1/dashboardassets/icon_pengeluaran_hari_ini.png'
import IconBulanIni from '../../assets1/dashboardassets/icon_pengeluaran_bulan_ini.png'
import IconJumlah from '../../assets1/dashboardassets/icon_jumlah_transaksi.png'

import IconMakanan from '../../assets1/dashboardassets/icon_makanan.png'
import IconTransportasi from '../../assets1/dashboardassets/icon_transportasi.png'
import IconBelanja from '../../assets1/dashboardassets/icon_belanja.png'
import IconTagihan from '../../assets1/dashboardassets/icon_tagihan.png'
import IconHiburan from '../../assets1/dashboardassets/icon_hiburan.png'
import IconLainnya from '../../assets1/dashboardassets/icon_lainnya.png'

import PillMakanan from '../../assets1/dashboardassets/makanan.png'
import PillTransportasi from '../../assets1/dashboardassets/transportasi.png'
import PillBelanja from '../../assets1/dashboardassets/belanja.png'
import PillTagihan from '../../assets1/dashboardassets/tagihan.png'
import PillHiburan from '../../assets1/dashboardassets/hiburan.png'
import PillLainnya from '../../assets1/dashboardassets/lainnya.png'

import {
  getDashboardSummary,
  getDashboardCategorySummary,
  getDashboardTotalTransaksi,
  getDashboardTerbaru,
} from '../../api/dashboard.api'
import { formatRupiah, formatTanggal } from '../../utils/format'
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

// Ikon kecil (daftar transaksi) dan label kategori (kartu Kategori Tertinggi).
const ASET_KATEGORI = {
  makanan: { icon: IconMakanan, pill: PillMakanan },
  transportasi: { icon: IconTransportasi, pill: PillTransportasi },
  belanja: { icon: IconBelanja, pill: PillBelanja },
  tagihan: { icon: IconTagihan, pill: PillTagihan },
  hiburan: { icon: IconHiburan, pill: PillHiburan },
  lainnya: { icon: IconLainnya, pill: PillLainnya },
}

function asetKategori(nama) {
  return (
    ASET_KATEGORI[String(nama || '').trim().toLowerCase()] ||
    ASET_KATEGORI.lainnya
  )
}

const angkaId = (n) => new Intl.NumberFormat('id-ID').format(n)

function DashboardPage({ user, onLogout, onNavigate }) {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0)
  const [terbaru, setTerbaru] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const [summaryData, categoryData, totalData, terbaruData] =
          await Promise.all([
            getDashboardSummary(),
            getDashboardCategorySummary(),
            getDashboardTotalTransaksi(),
            getDashboardTerbaru(4),
          ])

        if (cancelled) return

        setSummary(summaryData)
        setCategories(
          Array.isArray(categoryData?.categories)
            ? categoryData.categories
            : [],
        )
        setJumlahTransaksi(Number(totalData?.total_transaksi_bulan_ini) || 0)
        setTerbaru(
          Array.isArray(terbaruData?.transactions)
            ? terbaruData.transactions
            : [],
        )
      } catch (err) {
        if (cancelled) return

        if (err.status === 401) {
          onLogout()
          return
        }

        setError(err.message || 'Data dashboard gagal dimuat.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [onLogout])

  const totalHari = summary?.total_pengeluaran_hari_ini ?? 0
  const totalBulan = summary?.total_pengeluaran_bulan_ini ?? 0

  const tampil = (nilai) => (error ? '-' : formatRupiah(nilai))

  // Grafik selalu menampilkan 6 kategori. Nilai 0 jika data belum ada.
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

  const nilaiTerbesar = Math.max(1, ...kategoriGrafik.map((k) => k.total))
  const adaPengeluaran = kategoriGrafik.some((k) => k.total > 0)

  const kategoriTertinggi = adaPengeluaran
    ? kategoriGrafik.reduce((a, b) => (b.total > a.total ? b : a))
    : null

  const persenTertinggi =
    kategoriTertinggi && totalBulan > 0
      ? Math.min(100, (kategoriTertinggi.total / totalBulan) * 100)
      : 0

  return (
    <AppLayout
      activePage="dashboard"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="app-workspace">
        <header className="dashboard-header">
          <img
            src={HeaderImg}
            alt="Halo, Sahabat Finote! Pantau uang keluar kamu dengan mudah hari ini"
          />
        </header>

        <main className="dashboard-main">
          {error && (
            <div className="dashboard-error-message" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Tiga kartu ringkasan */}
              <section
                className="dashboard-summary"
                aria-label="Ringkasan pengeluaran"
              >
                <article className="dashboard-summary-card">
                  <img src={IconHariIni} alt="" />
                  <div>
                    <h2>Pengeluaran Hari Ini</h2>
                    <p className="dashboard-summary-value">{tampil(totalHari)}</p>
                  </div>
                </article>

                <article className="dashboard-summary-card">
                  <img src={IconBulanIni} alt="" />
                  <div>
                    <h2>Pengeluaran Bulan Ini</h2>
                    <p className="dashboard-summary-value">{tampil(totalBulan)}</p>
                  </div>
                </article>

                <article className="dashboard-summary-card">
                  <img src={IconJumlah} alt="" />
                  <div>
                    <h2>Jumlah Transaksi</h2>
                    <p className="dashboard-summary-value">
                      {error ? '-' : `${jumlahTransaksi} Transaksi`}
                    </p>
                  </div>
                </article>
              </section>

              <div className="dashboard-grid">
                {/* Grafik per kategori */}
                <section
                  className="dashboard-card dashboard-chart-card"
                  aria-label="Pengeluaran bulan ini per kategori"
                >
                  <img
                    className="dashboard-title-img"
                    src={ChartTitleImg}
                    alt="Pengeluaran Bulan Ini per Kategori"
                  />

                  {adaPengeluaran ? (
                    <>
                      <div className="dashboard-chart">
                        {kategoriGrafik.map((category) => {
                          const total = category.total
                          const tertinggi =
                            total > 0 && category.nama_kategori ===
                              kategoriTertinggi?.nama_kategori

                          const tinggi =
                            total > 0
                              ? Math.max((total / nilaiTerbesar) * 100, 6)
                              : 0

                          return (
                            <div
                              className={`dashboard-chart-column ${
                                tertinggi ? 'highest' : ''
                              }`}
                              key={category.kategori_id}
                            >
                              <span className="dashboard-chart-value">
                                {total > 0 ? angkaId(total) : 0}
                              </span>

                              <div className="dashboard-chart-bar-area">
                                <div
                                  className={`dashboard-chart-bar ${
                                    total === 0 ? 'empty' : ''
                                  }`}
                                  style={
                                    total > 0 ? { height: `${tinggi}%` } : undefined
                                  }
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

                      <div className="dashboard-chart-legend">
                        <span>
                          <i className="dot dot-blue" /> Pengeluaran
                        </span>
                        <span>
                          <i className="dot dot-orange" /> Tertinggi
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-empty">
                      <span className="dashboard-empty-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18" />
                          <rect x="5" y="12" width="4" height="9" />
                          <rect x="10" y="7" width="4" height="14" />
                          <rect x="15" y="3" width="4" height="18" />
                        </svg>
                      </span>
                      <h3>Belum ada pengeluaran bulan ini</h3>
                      <p>
                        Catat transaksi pertamamu dan grafik pengeluaran per
                        kategori akan tampil di sini.
                      </p>
                      <button
                        type="button"
                        className="dashboard-cta"
                        onClick={() => onNavigate?.('transaksi')}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                        Catat Transaksi
                      </button>
                    </div>
                  )}
                </section>

                <div className="dashboard-side">
                  {/* Kategori tertinggi */}
                  <section className="dashboard-card dashboard-highest-card">
                    <img
                      className="dashboard-title-img"
                      src={HighestTitleImg}
                      alt="Kategori Tertinggi"
                    />

                    {kategoriTertinggi && (
                      <img
                        className="dashboard-highest-pill"
                        src={asetKategori(kategoriTertinggi.nama_kategori).pill}
                        alt={kategoriTertinggi.nama_kategori}
                      />
                    )}

                    <p
                      className={`dashboard-highest-value ${
                        kategoriTertinggi ? '' : 'muted'
                      }`}
                    >
                      {formatRupiah(kategoriTertinggi?.total ?? 0)}
                    </p>

                    <div className="dashboard-progress" aria-hidden="true">
                      <span style={{ width: `${persenTertinggi}%` }} />
                    </div>

                    {!kategoriTertinggi && (
                      <p className="dashboard-highest-note">
                        Belum ada data pengeluaran bulan ini
                      </p>
                    )}
                  </section>

                  {/* Transaksi terakhir */}
                  <section className="dashboard-card dashboard-recent-card">
                    <div className="dashboard-recent-heading">
                      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      <h2>Transaksi Terakhir</h2>
                    </div>

                    {terbaru.length > 0 ? (
                      <>
                        <ul className="dashboard-recent-list">
                          {terbaru.map((item) => (
                            <li key={item.transaksi_id}>
                              <img
                                src={asetKategori(item.nama_kategori).icon}
                                alt={item.nama_kategori}
                              />
                              <div className="dashboard-recent-info">
                                <strong>{item.catatan || item.nama_kategori}</strong>
                                <span>{formatTanggal(item.tanggal)}</span>
                              </div>
                              <span className="dashboard-recent-amount">
                                {formatRupiah(item.jumlah)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          className="dashboard-recent-link"
                          onClick={() => onNavigate?.('riwayat')}
                        >
                          Lihat semua riwayat
                          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 6 6 6-6 6" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="dashboard-empty small">
                        <img src={IconJumlah} alt="" />
                        <h3>Belum ada transaksi</h3>
                        <p>Transaksi yang kamu catat akan muncul di sini.</p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </AppLayout>
  )
}

export default DashboardPage
