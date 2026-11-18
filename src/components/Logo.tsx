// Logo AMANDA (latar transparan). Tiga varian:
//  - ikon   : lambang saja, untuk bilah atas / sisi (kecil)
//  - penuh  : lambang + tulisan AMANDA + subjudul (statis)
//  - animasi: seperti penuh, berputar; menjadi statis bila pengguna memilih "kurangi gerak"
import { useRef, useState } from 'react';

const dasar = import.meta.env.BASE_URL;

// Lambang kecil untuk sidebar: bergerak sekali saat halaman dibuka dan sekali lagi saat kursor di atasnya, lalu diam.
// Bila pengguna memilih "kurangi gerak", memakai gambar statis.
export function LogoGerak({ tinggi = 28 }: { tinggi?: number }) {
  const [putar, setPutar] = useState(0);
  const terakhir = useRef(Date.now());
  const ulang = () => {
    if (Date.now() - terakhir.current < 2600) return;
    terakhir.current = Date.now();
    setPutar((n) => n + 1);
  };
  const alt = 'Logo AMANDA — Aplikasi Manajemen Data Anggaran';
  const lebar = Math.round(tinggi * 78 / 62);
  return (
    <picture onMouseEnter={ulang}>
      <source media="(prefers-reduced-motion: reduce)" srcSet={`${dasar}logo-ikon.png`} />
      <img src={`${dasar}logo-ikon-animasi.webp?p=${putar % 2}`} alt={alt} height={tinggi} width={lebar} style={{ height: tinggi, width: lebar }} className="object-contain" decoding="async" />
    </picture>
  );
}

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
