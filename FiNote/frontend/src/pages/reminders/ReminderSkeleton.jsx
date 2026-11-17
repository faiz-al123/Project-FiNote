// Memakai class .skeleton dari DashboardSkeleton.css
import '../dashboard/DashboardSkeleton.css'
import './ReminderSkeleton.css'

const JUMLAH_BARIS = 8

// Lebar kolom Deskripsi divariasikan agar terlihat natural
const LEBAR_DESKRIPSI = ['80%', '55%', '70%', '45%', '65%']

// Pengganti angka di kartu ringkasan (menggantikan <strong>{count}</strong>)
export function ReminderCountSkeleton() {
  return (
    <span
      className="skeleton reminder-skeleton reminder-skeleton-count"
      aria-hidden="true"
    />
  )
}

// Dipakai DI DALAM <tbody>, menggantikan teks "memuat daftar pengingat..."
export function ReminderTableSkeleton() {
  return (
    <>
      {Array.from({ length: JUMLAH_BARIS }, (_, i) => (
        <tr key={i} className="reminder-skeleton-row" aria-hidden="true">
          <td>
            <span className="skeleton reminder-skeleton reminder-skeleton-date" />
          </td>
          <td>
            <span
              className="skeleton reminder-skeleton reminder-skeleton-text"
              style={{ width: LEBAR_DESKRIPSI[i % LEBAR_DESKRIPSI.length] }}
            />
          </td>
          <td>
            <span className="skeleton reminder-skeleton reminder-skeleton-badge" />
          </td>
          <td>
            <span className="skeleton reminder-skeleton reminder-skeleton-amount" />
          </td>
          <td>
            <div className="reminder-actions">
              <span className="skeleton reminder-skeleton reminder-skeleton-done" />
              <span className="skeleton reminder-skeleton reminder-skeleton-delete" />
              <span className="skeleton reminder-skeleton reminder-skeleton-delete" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}