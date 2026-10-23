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