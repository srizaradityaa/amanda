// Mengambil ID video dari tautan YouTube. Aturan sama dengan validasi di basis data (adm_portal_simpan).
// Hanya youtube.com dan youtu.be yang diterima; hasil selalu 11 karakter [A-Za-z0-9_-], sehingga aman dipasang pada alamat embed.
const POLA = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[&?/#].*)?$/;
export function idYoutube(masukan: string): string | null {
  const v = masukan.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  return v.length <= 300 ? (POLA.exec(v)?.[1] ?? null) : null;
}
/** Alamat embed: senyap, otomatis, berulang, tanpa kontrol, tanpa pelacakan cookie. */
export function alamatEmbed(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&cc_load_policy=0&fs=0`;
}
