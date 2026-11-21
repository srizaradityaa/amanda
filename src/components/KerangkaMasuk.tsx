// Kerangka visual layar setelah login (pilih TA, pilih jabatan, memuat data): latar garis dan kartu kaca seperti halaman masuk.
import type { ReactNode } from 'react';
import { LatarKisi } from '@/components/LatarKisi';
import { Logo } from '@/components/Logo';

export function KerangkaMasuk({ children, lebar = 'max-w-md' }: { children: ReactNode; lebar?: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink p-6 text-mist">
      <LatarKisi />
      <div className={`relative z-10 w-full ${lebar}`}>
        <div className="rounded-2xl border border-amber/30 bg-ink-surface/65 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <div className="mb-5 flex justify-center"><Logo varian="animasi" tinggi={110} /></div>
          {children}
        </div>
        <p className="mt-4 text-center text-2xs text-mist-dim">AMANDA &copy; 2026 Pemerintah Kabupaten Balangan • Kecamatan Batumandi</p>
      </div>
    </div>
  );
}

// Layar tunggu saat data dimuat dari server.
export function LayarMemuat() {
  return (
    <KerangkaMasuk lebar="max-w-xs">
      <div role="status" className="text-center">
        <div className="mx-auto h-1 w-40 overflow-hidden rounded-full bg-ink-edge">
          <div className="h-full w-1/3 rounded-full bg-amber" style={{ animation: 'amanda-geser 1.1s ease-in-out infinite' }} />
        </div>
        <p className="mt-4 text-sm text-mist-dim">Menyiapkan data…</p>
      </div>
    </KerangkaMasuk>
  );
}
