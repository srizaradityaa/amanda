/** Nama lengkap: gelar depan dengan spasi, gelar belakang dipisah koma — "Dr. Adit, S.Sos". Koma ketikan pengguna tidak digandakan. */
export function namaLengkap(p: { gelar_depan?: string | null; nama: string; gelar_belakang?: string | null }): string {
  const depan = [(p.gelar_depan ?? '').trim(), p.nama.trim()].filter(Boolean).join(' ');
  const belakang = (p.gelar_belakang ?? '').trim().replace(/^[,\s]+/, '');
  return belakang ? `${depan}, ${belakang}` : depan;
}
