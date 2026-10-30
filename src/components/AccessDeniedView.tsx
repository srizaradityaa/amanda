import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface AccessDeniedViewProps {
  onBack: () => void;
}

export function AccessDeniedView({ onBack }: AccessDeniedViewProps) {
  return (
    <div className="animate-fade-in">
      <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="h-12 w-12 bg-bg border border-border-strong flex items-center justify-center mb-4">
          <ShieldAlert className="h-6 w-6 text-status-red" strokeWidth={1.5} />
        </div>
        <h1 className="text-base font-semibold text-ink-primary mb-1.5">Akses ditolak</h1>
        <p className="text-sm text-ink-secondary max-w-md leading-relaxed">
          Peran Anda tidak memiliki izin untuk membuka halaman ini. Gunakan menu navigasi untuk
          berpindah ke halaman yang tersedia.
        </p>
        <button type="button" onClick={onBack} className="btn-amber mt-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Dasbor</span>
        </button>
      </div>
    </div>
  );
}
