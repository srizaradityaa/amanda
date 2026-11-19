// Teks berjalan di atas halaman login. Hanya agregat publik (persentase, cacah, nama seksi) yang sama dengan Portal Keterbukaan.
// Dimuat setelah formulir tampil; bila gagal, bilah tetap berisi info layanan. Berhenti saat kursor di atasnya; diam bila "kurangi gerak".
import { useEffect, useState } from 'react';
import { daftarTAPublikAsync, ringkasanPublikAsync, type RingkasanPublik } from '@/data/publik';

const INFO = [
  'Lupa kata sandi? Hubungi Admin',
  'Sesi berakhir otomatis setelah 1 jam tanpa aktivitas',
  'Jangan bagikan kata sandi Anda',
  'Waktu mengikuti WITA (UTC+8)',
];

export function TikerLogin() {
  const [r, setR] = useState<RingkasanPublik | null>(null);
  useEffect(() => {
    let batal = false;
    void (async () => {
      try {
        const d = await daftarTAPublikAsync();
        const ta = d.find((t) => t.bawaan) ?? d[0]; if (!ta) return;
        const x = await ringkasanPublikAsync(ta.id);
        if (!batal && x) setR(x);
      } catch { /* diam: bilah tetap menampilkan info layanan */ }
    })();
    return () => { batal = true; };
  }, []);

  const item = (kunci: string, isi: React.ReactNode) => (
    <span key={kunci} className="inline-flex items-center gap-2 border-r border-ink-edge px-5">{isi}</span>
  );
  const butir: React.ReactNode[] = [];
  if (r) {
    if (r.persen_realisasi != null) butir.push(item('real', <><span className="text-mist-dim">{r.ta_label} · Realisasi instansi</span><b className="mono">{r.persen_realisasi.toString().replace('.', ',')}%</b></>));
    butir.push(item('spj', <><span className="text-mist-dim">SPJ dibukukan</span><b className="mono">{r.kategori.find((k) => k.kode === 'selesai')?.cacah ?? 0}</b></>));
    [...r.seksi].filter((s) => s.persen != null).sort((a, b) => a.peringkat - b.peringkat).forEach((s) =>
      butir.push(item('s' + s.id, <><span className="text-mist-dim">{s.peringkat}.</span><b className="text-mist">{s.nama}</b><b className="mono">{String(s.persen).replace('.', ',')}%</b></>)));
  }
  INFO.forEach((t, i) => butir.push(item('i' + i, <span className="text-mist-dim">{t}</span>)));

  return (
    <div className="tiker-login relative z-10 overflow-hidden border-b border-ink-edge bg-ink/80 py-2.5 text-xs" role="marquee" aria-label="Informasi berjalan">
      <div className="tiker-jalan flex w-max whitespace-nowrap">
        <div className="flex">{butir}</div>
        <div className="flex" aria-hidden>{butir}</div>
      </div>
    </div>
  );
}
