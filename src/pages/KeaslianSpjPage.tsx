import { ArrowLeft, ShieldCheck, ShieldX } from 'lucide-react';
import { findKeaslianByToken } from '@/data/keaslianMock';
import { formatTanggalWita } from '@/lib/formatDate';

interface KeaslianSpjPageProps {
  token: string;
  onBack: () => void;
}

export function KeaslianSpjPage({ token, onBack }: KeaslianSpjPageProps) {
  const record = findKeaslianByToken(token);
  const berlaku = record?.berlaku === true;
  const Icon = berlaku ? ShieldCheck : ShieldX;

  return (
    <div className="min-h-screen bg-bg text-ink-primary flex flex-col">
      <header className="h-14 bg-surface border-b border-border flex items-center px-6 gap-4">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1.5" type="button">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Login</span>
        </button>
        <div className="w-px h-6 bg-border" />
        <span className="text-sm font-medium text-ink-primary">Verifikasi Keaslian SPJ</span>
        <span className="ml-auto text-2xs text-ink-muted uppercase tracking-wider">Tanpa Login</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="surface-card p-7 sm:p-9 text-center">
            <div
              className={`h-16 w-16 mx-auto bg-bg border flex items-center justify-center mb-6 ${
                berlaku ? 'border-status-green/50' : 'border-status-red/50'
              }`}
            >
              <Icon
                className={`h-8 w-8 ${berlaku ? 'text-status-green' : 'text-status-red'}`}
                strokeWidth={1.5}
              />
            </div>

            <p className="text-2xs uppercase tracking-wider text-ink-muted mb-2">Status Keaslian</p>
            <h1
              className={`text-2xl font-bold mb-6 ${
                berlaku ? 'text-status-green' : 'text-status-red'
              }`}
            >
              {berlaku ? 'Berlaku' : 'Tidak berlaku'}
            </h1>

            {record ? (
              <dl className="text-left divide-y divide-border border-y border-border">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-2xs uppercase tracking-wider text-ink-muted">Tahun Anggaran</dt>
                  <dd className="text-sm text-ink-primary text-right">{record.taName}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-2xs uppercase tracking-wider text-ink-muted">Seksi</dt>
                  <dd className="text-sm text-ink-primary text-right">{record.seksiName}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-2xs uppercase tracking-wider text-ink-muted">Tanggal Verifikasi</dt>
                  <dd className="text-sm text-ink-primary text-right">
                    {formatTanggalWita(record.tanggalVerifikasi)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-ink-secondary leading-relaxed">
                Token pada tautan ini tidak dikenali. Pastikan Anda memindai barcode yang tercetak
                pada Hasil Verifikasi SPJ.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
