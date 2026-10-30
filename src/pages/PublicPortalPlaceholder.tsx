import { ArrowLeft, Globe, Info } from 'lucide-react';

interface PublicPortalPlaceholderProps {
  onBack: () => void;
}

export function PublicPortalPlaceholder({ onBack }: PublicPortalPlaceholderProps) {
  return (
    <div className="min-h-screen bg-bg text-ink-primary flex flex-col">
      <header className="h-14 bg-surface border-b border-border flex items-center px-6 gap-4">
        <button
          onClick={onBack}
          className="btn-ghost flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Login</span>
        </button>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-teal" />
          <span className="text-sm font-medium text-ink-primary">Portal Keterbukaan Informasi Publik</span>
        </div>
        <span className="ml-auto text-2xs text-ink-muted uppercase tracking-wider">Tanpa Login • Agregat</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl text-center animate-fade-in">
          <div className="h-14 w-14 mx-auto bg-surface border border-border-strong flex items-center justify-center mb-6">
            <Globe className="h-7 w-7 text-teal" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-ink-primary mb-3">
            Portal Keterbukaan Informasi Anggaran
          </h1>
          <p className="text-ink-secondary leading-relaxed mb-8">
            Halaman publik menampilkan persentase realisasi, cacah status SPJ, dan peringkat seksi
            berdasarkan data BKU yang telah dibukukan — tanpa menampilkan nominal rupiah mentah,
            identitas, atau data transaksi pribadi.
          </p>
          <div className="surface-card p-5 flex items-start gap-3 text-left">
            <Info className="h-5 w-5 text-amber shrink-0 mt-0.5" />
            <div className="text-sm text-ink-secondary leading-relaxed">
              Portal ini sedang dalam pengembangan sesuai Tema Treasury & Market Terminal.
              Pada layar besar akan memakai kepadatan Pro Mode (ticker, donut, gauge, peringkat);
              pada layar kecil beralih ke mode standar satu kolom.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
