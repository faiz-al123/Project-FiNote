// 50000 -> "Rp 50.000"
export function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(Number(angka) || 0)
    .replace(/\u00a0/g, ' ')
}

// "2026-11-30" -> "30/11/2026"
export function formatTanggal(tanggal) {
  const bagian = String(tanggal || '').slice(0, 10).split('-')
  if (bagian.length !== 3) return tanggal || '-'
  return `${bagian[2]}/${bagian[1]}/${bagian[0]}`
}
