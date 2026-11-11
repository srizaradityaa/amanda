// Logo AMANDA (latar transparan). Tiga varian:
//  - ikon   : lambang saja, untuk bilah atas / sisi (kecil)
//  - penuh  : lambang + tulisan AMANDA + subjudul (statis)
//  - animasi: seperti penuh, berputar; menjadi statis bila pengguna memilih "kurangi gerak"
const dasar = import.meta.env.BASE_URL;

export function Logo({
  varian = 'ikon', tinggi, className = '',
}: { varian?: 'ikon' | 'penuh' | 'animasi'; tinggi?: number; className?: string }) {
  const alt = 'Logo AMANDA — Aplikasi Manajemen Data Anggaran';
  if (varian === 'ikon') {
    const t = tinggi ?? 28;
    return <img src={`${dasar}logo-ikon.png`} alt={alt} height={t} width={t} style={{ height: t, width: t }} className={`object-contain ${className}`} decoding="async" />;
  }
  const t = tinggi ?? 160;
  const gaya = { height: t, width: 'auto' };
  if (varian === 'penuh') {
    return <img src={`${dasar}logo-amanda.png`} alt={alt} style={gaya} className={`object-contain ${className}`} decoding="async" />;
  }
  return (
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={`${dasar}logo-amanda.png`} />
      <img src={`${dasar}logo-amanda-animasi.webp`} alt={alt} style={gaya} className={`object-contain ${className}`} decoding="async" />
    </picture>
  );
}
