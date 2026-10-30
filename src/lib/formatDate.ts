export function formatTanggalWita(iso: string): string {
  return new Date(`${iso}T00:00:00+08:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  });
}
