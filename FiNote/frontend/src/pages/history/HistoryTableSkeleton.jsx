// Memakai class .skeleton dari DashboardSkeleton.css
import '../dashboard/DashboardSkeleton.css'
import './HistoryTableSkeleton.css'

// 10 baris cukup memenuhi kotak tabel (tinggi 470px)
const JUMLAH_BARIS = 10

// Lebar tiap kolom divariasikan agar terlihat natural
const LEBAR_DESKRIPSI = ['80%', '55%', '70%', '45%', '65%']

// Dipakai DI DALAM <tbody>, menggantikan baris "Memuat riwayat transaksi..."
function HistoryTableSkeleton() {
  return (
    <>
      {Array.from({ length: JUMLAH_BARIS }, (_, i) => (
        <tr
          key={i}
          className="history-skeleton-row"
          aria-hidden="true"
        >
          <td className="history-number-column">
            <span className="skeleton skeleton-cell skeleton-cell-no" />
          </td>
          <td>
            <span className="skeleton skeleton-cell skeleton-cell-date" />
          </td>
          <td>
            <span
              className="skeleton skeleton-cell"
              style={{ width: LEBAR_DESKRIPSI[i % LEBAR_DESKRIPSI.length] }}
            />
          </td>
          <td>
            <span className="skeleton skeleton-cell skeleton-cell-category" />
          </td>
          <td>
            <span className="skeleton skeleton-cell skeleton-cell-amount" />
          </td>
        </tr>
      ))}
    </>
  )
}

export default HistoryTableSkeleton
