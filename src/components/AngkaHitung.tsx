// Tampilan saja: angka Rupiah berhitung dari 0 sampai nilai sebenarnya, sekali saat halaman dibuka.
// Nilai yang ditampilkan di akhir selalu sama persis dengan formatRupiah(nilai). Tanpa pustaka tambahan.
import { useEffect, useRef, useState } from 'react';
import { formatRupiah } from '@/lib/format';

const DURASI = 900;

function kurangiGerak(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

export function AngkaRupiah({ nilai }: { nilai: number }) {
  const [tampil, setTampil] = useState(0);
  const selesai = useRef(false);

  useEffect(() => {
    if (selesai.current || kurangiGerak() || !Number.isFinite(nilai) || nilai === 0) {
      selesai.current = true;
      setTampil(nilai);
      return;
    }
    let raf = 0;
    const mulai = performance.now();
    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / DURASI);
      const e = 1 - Math.pow(1 - p, 3);
      setTampil(Math.round(nilai * e));
      if (p < 1) raf = requestAnimationFrame(langkah);
      else { selesai.current = true; setTampil(nilai); }
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [nilai]);

  return <>{formatRupiah(tampil)}</>;
}
